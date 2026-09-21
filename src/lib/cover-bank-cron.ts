// Abastecimento do banco curado de capas da Wire TV.
//
// Divisão de trabalho, igual à do resto do pipeline de capa: quem tem a
// chave do Pexels e a rede é o runner do GitHub Actions
// (scripts/fill-cover-bank.mjs) — ele busca, filtra e baixa os bytes; aqui só
// se valida e grava. O Worker nunca chama o Pexels, e a PEXELS_API_KEY não
// precisa virar secret do Cloudflare.
//
// Por que não deixar o runner escrever direto no Postgres: a DATABASE_URL não
// é secret do Actions hoje, e transformá-la nisso daria ao workflow acesso de
// escrita ao banco inteiro para cadastrar imagem. Este endpoint faz uma coisa
// só, com teto por editoria e validação de tipo.
import { and, asc, eq, exists, isNull, like, not, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { articles, mediaImages, users } from "./schema";
import { BEAT_VALUES, isBeat } from "./beats";
import {
  bankFilename,
  buildBankAltText,
  isBankSource,
  LIBRARY_COVER_PREFIX,
  MAX_BANK_PER_BEAT,
  parseBankCredit,
  pickRelevantCover,
  type BankSource,
} from "./cover-bank";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg"]);
const MAX_BANK_IMAGE_BYTES = 5 * 1024 * 1024;

function unauthorized(request: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("CRON_SECRET não configurada", { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  return null;
}

async function inventory(db: ReturnType<typeof getDb>) {
  const rows = await db
    .select({ filename: mediaImages.filename })
    .from(mediaImages)
    .where(like(mediaImages.filename, `${LIBRARY_COVER_PREFIX}%`));

  const bank: Record<string, string[]> = {};
  for (const beat of BEAT_VALUES) bank[beat] = [];
  for (const row of rows) {
    // O prefixo já filtrou na consulta; aqui só se separa por editoria, e um
    // nome fora das cinco conhecidas é ignorado em vez de derrubar a resposta.
    const beat = BEAT_VALUES.find((value) =>
      row.filename.startsWith(`${LIBRARY_COVER_PREFIX}${value}-`),
    );
    if (beat) bank[beat].push(row.filename);
  }
  return bank;
}

// O runner consulta antes de buscar no Pexels: assim ele sabe quantas faltam
// por editoria e quais ids já estão cadastrados, e não gasta chamada de API
// nem largura de banda para baixar foto que seria recusada aqui.
export async function handleCoverBankInventoryCron(request: Request): Promise<Response> {
  const denied = unauthorized(request);
  if (denied) return denied;

  const bank = await inventory(getDb());
  return Response.json({
    ok: true,
    maxPerBeat: MAX_BANK_PER_BEAT,
    bank,
    totals: Object.fromEntries(Object.entries(bank).map(([beat, list]) => [beat, list.length])),
  });
}

// Esvazia o banco curado antes de cada abastecimento — o "apague todas as
// imagens do banco e só alimente a cada sessão", pedido do editor-chefe em
// 20/09. Antes, o banco ACUMULAVA: o abastecimento só completava o que
// faltava para o alvo, então a foto cadastrada em setembro continuava
// saindo em capa meses depois. Zerando a cada rodada, toda capa publicada
// vem de uma busca feita naquela sessão.
//
// DUAS TRAVAS, e nenhuma é opcional:
//
// 1. Só apaga o que tem o prefixo `wire-banco-`. O resto da biblioteca do
//    Admin (88 imagens em 20/09 — capas de curso, cards, uploads à mão) NÃO
//    é o banco da Wire e não entra aqui. Apagar a biblioteca inteira
//    derrubaria imagem que outras páginas servem.
//
// 2. Nunca apaga imagem que alguma matéria publicada está servindo como capa
//    (`coverImageUrl` apontando para /api/media-images/<id>). A capa da
//    matéria no ar é servida DESTA linha: apagá-la troca a capa por um 404
//    numa matéria já publicada. Em 20/09 havia uma matéria nessa situação
//    (alerta-amarelo-tempestade..., servindo wire-banco-clima-pexels-1689645)
//    e uma outra já quebrada por uma imagem que sumiu antes desta trava
//    existir — é exatamente o estrago que esta cláusula impede.
// A imagem está servindo de capa em alguma matéria publicada? É esta condição
// que a trava 2 usa. Fica numa função porque o DELETE e a simulação precisam
// usar EXATAMENTE a mesma: se divergirem, a simulação passa a prometer um
// resultado que a rodada real não entrega.
//
// `not(exists(...))` em vez de ler os ids em uso e mandar um notInArray: a
// lista de capas cresce com o acervo, e uma consulta que monta IN com 68 ids
// hoje monta com 600 depois.
function emUsoComoCapa(db: ReturnType<typeof getDb>) {
  return exists(
    db
      .select({ um: sql`1` })
      .from(articles)
      .where(
        and(
          eq(articles.status, "published"),
          like(articles.coverImageUrl, sql`'%/api/media-images/' || ${mediaImages.id}`),
        ),
      ),
  );
}

function agruparPorEditoria(filenames: string[]) {
  const bank: Record<string, string[]> = {};
  for (const beat of BEAT_VALUES) bank[beat] = [];
  for (const filename of filenames) {
    const beat = BEAT_VALUES.find((value) =>
      filename.startsWith(`${LIBRARY_COVER_PREFIX}${value}-`),
    );
    if (beat) bank[beat].push(filename);
  }
  return bank;
}

export async function handleCoverBankPurgeCron(request: Request): Promise<Response> {
  const denied = unauthorized(request);
  if (denied) return denied;

  const db = getDb();
  const antes = await inventory(db);
  const doPrefixo = like(mediaImages.filename, `${LIBRARY_COVER_PREFIX}%`);

  // `?dryRun=1` responde o que a rodada real faria, SEM apagar. Existe porque
  // a primeira simulação (21/09) não simulava nada: ela pulava o expurgo, lia
  // o banco ainda cheio, via que já passava do alvo e concluía "nada a fazer"
  // — ou seja, prometia o oposto do que a rodada real faz. Simulação que não
  // espelha a rodada real é pior que não ter simulação, porque dá confiança.
  if (new URL(request.url).searchParams.get("dryRun")) {
    const preservadas = await db
      .select({ filename: mediaImages.filename })
      .from(mediaImages)
      .where(and(doPrefixo, emUsoComoCapa(db)));
    const total = Object.values(antes).reduce((soma, lista) => soma + lista.length, 0);
    const bank = agruparPorEditoria(preservadas.map((linha) => linha.filename));

    return Response.json({
      ok: true,
      preview: true,
      apagaria: total - preservadas.length,
      preservaria: preservadas.length,
      // Mesma forma da resposta do inventário, para quem simula poder tratar
      // o estado pós-expurgo como ponto de partida sem converter nada.
      maxPerBeat: MAX_BANK_PER_BEAT,
      bank,
      totals: Object.fromEntries(Object.entries(bank).map(([beat, l]) => [beat, l.length])),
    });
  }

  const apagadas = await db
    .delete(mediaImages)
    .where(and(doPrefixo, not(emUsoComoCapa(db))))
    .returning({ filename: mediaImages.filename });

  const depois = await inventory(db);
  const preservadas = Object.values(depois).reduce((soma, lista) => soma + lista.length, 0);

  return Response.json({
    ok: true,
    apagadas: apagadas.length,
    // Preservadas são as que alguma matéria publicada ainda serve como capa.
    // Não é sobra de limpeza mal feita: é a trava 2 funcionando.
    preservadas,
    antes: Object.fromEntries(Object.entries(antes).map(([beat, l]) => [beat, l.length])),
    depois: Object.fromEntries(Object.entries(depois).map(([beat, l]) => [beat, l.length])),
  });
}

export async function handleCoverBankAddCron(request: Request): Promise<Response> {
  const denied = unauthorized(request);
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response("corpo inválido", { status: 400 });
  }

  const input = payload as {
    beat?: unknown;
    photoId?: unknown;
    photographer?: unknown;
    term?: unknown;
    mimeType?: unknown;
    dataBase64?: unknown;
    source?: unknown;
  };

  if (!isBeat(input.beat)) return new Response("editoria inválida", { status: 400 });
  if (typeof input.photoId !== "string" || !/^\d+$/.test(input.photoId)) {
    return new Response("photoId inválido", { status: 400 });
  }
  if (typeof input.photographer !== "string" || !input.photographer.trim()) {
    return new Response("photographer é obrigatório — sem ele a foto entra sem crédito", {
      status: 400,
    });
  }
  if (typeof input.term !== "string" || !input.term.trim()) {
    return new Response("term é obrigatório", { status: 400 });
  }
  // A fonte é opcional para não quebrar chamador antigo, que só mandava foto
  // do Pexels. O que ela NÃO pode ser é um valor qualquer: a fonte entra no
  // nome do arquivo e no crédito, e um valor livre ali passaria a produzir
  // nome que parseBankFilename não lê de volta.
  if (input.source !== undefined && !isBankSource(input.source)) {
    return new Response("source precisa ser pexels ou pixabay", { status: 400 });
  }
  const source: BankSource | undefined = isBankSource(input.source) ? input.source : undefined;
  if (typeof input.mimeType !== "string" || !ALLOWED_MIME_TYPES.has(input.mimeType)) {
    return new Response("o banco só aceita image/jpeg", { status: 400 });
  }
  if (typeof input.dataBase64 !== "string" || !input.dataBase64) {
    return new Response("dataBase64 é obrigatório", { status: 400 });
  }

  let bytes: Uint8Array;
  try {
    const binary = atob(input.dataBase64);
    bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  } catch {
    return new Response("dataBase64 não decodifica", { status: 400 });
  }

  if (bytes.length === 0 || bytes.length > MAX_BANK_IMAGE_BYTES) {
    return new Response(`imagem fora do limite: ${bytes.length} bytes`, { status: 400 });
  }
  // Mesma lição do downloadTo em scripts/lib/photo-sources.mjs: o CDN do
  // Pexels devolve o formato do original quando o parâmetro de formato se
  // perde, e já houve arquivo PNG gravado com extensão .jpg. Aqui isso viraria
  // linha de banco servida com content-type errado.
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
    return new Response("os bytes não são JPEG", { status: 400 });
  }

  const db = getDb();
  const beat = input.beat;
  const filename = bankFilename({ beat, photoId: input.photoId, source });

  const [existing] = await db
    .select({ id: mediaImages.id })
    .from(mediaImages)
    .where(eq(mediaImages.filename, filename))
    .limit(1);
  if (existing) return Response.json({ ok: true, skipped: "já cadastrada", filename });

  // O teto é checado aqui, não só no runner: o endpoint é o que protege o
  // banco, e quem chama pode estar desatualizado ou rodando duas vezes.
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mediaImages)
    .where(like(mediaImages.filename, `${LIBRARY_COVER_PREFIX}${beat}-%`));
  if (count >= MAX_BANK_PER_BEAT) {
    return Response.json({ ok: true, skipped: `editoria cheia (${count})`, filename });
  }

  const [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);
  if (!admin) return new Response("Nenhum administrador disponível", { status: 500 });

  await db.insert(mediaImages).values({
    filename,
    mimeType: input.mimeType,
    sizeBytes: bytes.length,
    width: null,
    height: null,
    altText: buildBankAltText({
      photographer: input.photographer.trim(),
      beat,
      term: input.term.trim(),
      source,
    }),
    data: input.dataBase64,
    uploadedBy: admin.id,
  });

  return Response.json({ ok: true, saved: filename });
}

// Matérias publicadas que ainda não têm fotografia — `coverPhotoId` nulo é o
// que marca capa de arte gerada (e, antes dela, card tipográfico ou foto fixa
// da editoria). Devolve, para cada uma, a imagem do banco que ela deve
// receber, já escolhida aqui: a distribuição precisa do banco inteiro à vista
// para não dar a mesma foto a duas matérias, e quem tem essa visão é o
// servidor, não o runner.
//
// Quem baixa e commita é o runner do Actions (scripts/swap-art-covers.mjs),
// pelo mesmo motivo de sempre: Cloudflare Workers não escrevem em disco.
export async function handleArtCoversCron(request: Request): Promise<Response> {
  const denied = unauthorized(request);
  if (denied) return denied;

  const db = getDb();
  // `coverPhotoId` nulo marca capa sem fotografia de banco — mas também fica
  // nulo quando alguém escolheu a capa à mão pelo Admin, e essas apontam para
  // /api/media-images/. Medido em 16/09: três matérias entraram na troca por
  // isso, receberam arquivo que ninguém usa e tiveram o registro recusado
  // pelo set-cover-image ("capa é manual") — a proteção funcionou, mas só
  // depois de o arquivo já ter sido commitado.
  //
  // O caminho aqui espelha mediaLibraryImageId, em article-cron.ts: se um dos
  // dois mudar, capa manual volta a ser sobrescrita.
  const pendentes = await db
    .select({
      slug: articles.slug,
      beat: articles.beat,
      headline: articles.headline,
      excerpt: articles.excerpt,
    })
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        isNull(articles.coverPhotoId),
        or(
          isNull(articles.coverImageUrl),
          not(like(articles.coverImageUrl, "%/api/media-images/%")),
        ),
      ),
    )
    .orderBy(asc(articles.publishedAt));

  const banco = await db
    .select({ id: mediaImages.id, filename: mediaImages.filename, altText: mediaImages.altText })
    .from(mediaImages)
    .where(like(mediaImages.filename, `${LIBRARY_COVER_PREFIX}%`))
    .orderBy(asc(mediaImages.createdAt));

  const porEditoria = new Map<string, typeof banco>();
  for (const beat of BEAT_VALUES) {
    porEditoria.set(
      beat,
      banco.filter((row) => row.filename.startsWith(`${LIBRARY_COVER_PREFIX}${beat}-`)),
    );
  }

  // Rodízio por CENA, não mais por editoria. A distribuição passou a ser
  // feita por pickRelevantCover, a mesma função que o servidor usa ao
  // publicar: as duas precisam concordar, senão a capa que a matéria recebe
  // ao nascer deixa de ser a que esta troca em lote daria depois.
  //
  // O offset continua existindo para duas matérias do mesmo assunto no mesmo
  // lote não levarem a mesma foto — mas agora ele conta dentro da cena, e é
  // por isso que a chave é `${beat}:${term}` e não só a editoria.
  const usados = new Map<string, number>();
  const jaAtribuidas: string[] = [];
  const faltando: string[] = [];
  const atribuicoes = [];
  for (const artigo of pendentes) {
    const disponiveis = porEditoria.get(artigo.beat) ?? [];
    if (disponiveis.length === 0) {
      faltando.push(artigo.slug);
      continue;
    }

    const materia = { headline: artigo.headline, excerpt: artigo.excerpt };
    // Duas passadas: a primeira pergunta qual cena a matéria pede (offset 0),
    // a segunda aplica o rodízio dentro daquela cena. Sem isso o offset de
    // uma cena empurraria a escolha da outra.
    const sondagem = pickRelevantCover({ beat: artigo.beat, materia, candidatos: disponiveis });
    const chave = `${artigo.beat}:${sondagem?.term ?? "-"}`;
    const indice = usados.get(chave) ?? 0;
    usados.set(chave, indice + 1);

    const escolhida = pickRelevantCover({
      beat: artigo.beat,
      materia,
      candidatos: disponiveis,
      // Dentro do lote, uma foto já entregue a outra matéria é "recente":
      // é o que espalha o acervo em vez de dar a mesma capa a todas as
      // matérias de enchente de uma vez.
      usadosRecentemente: jaAtribuidas,
      offset: indice,
    });
    if (!escolhida) {
      faltando.push(artigo.slug);
      continue;
    }
    jaAtribuidas.push(escolhida.id);

    const linha = disponiveis.find((candidato) => candidato.id === escolhida.id);
    atribuicoes.push({
      slug: artigo.slug,
      beat: artigo.beat,
      headline: artigo.headline,
      excerpt: artigo.excerpt,
      photoId: escolhida.id,
      photoCredit: parseBankCredit(linha?.altText ?? null),
      // A cena que casou e se ela veio do texto da matéria ou do rodízio.
      // O runner imprime no resumo: é assim que se confere, sem abrir o site,
      // se a troca melhorou as capas ou só as embaralhou.
      term: escolhida.term,
      relevante: escolhida.relevante,
      repetida: indice >= disponiveis.length,
    });
  }

  return Response.json({
    ok: true,
    total: atribuicoes.length,
    relevantes: atribuicoes.filter((item) => item.relevante).length,
    porRodizio: atribuicoes.filter((item) => !item.relevante).length,
    repetidas: atribuicoes.filter((item) => item.repetida).length,
    semBanco: faltando,
    artigos: atribuicoes,
  });
}
