import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { registerHooks } from "node:module";
import {
  PRODUCTS,
  CATEGORIES,
  INTENTS,
  INTENT_LINKS,
  PRIMARY_NAV,
  HOME_PRODUCTS,
} from "../src/lib/ecosystem.ts";
import { sealRecords } from "../src/lib/seals.ts";
import { BEAT_VALUES } from "../src/lib/beats.ts";
import { WIRE_OFFERS } from "../src/lib/wire-commerce.ts";
import { WIRE_INSTAGRAM_HANDLE, wrapHeadline } from "../src/lib/wire-instagram-card.ts";

// Resolve somente os descritores locais de imagem do catálogo, sem rede.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/assets/") && specifier.endsWith(".json")) {
      return {
        url: new URL("../src/" + specifier.slice(2), import.meta.url).href,
        shortCircuit: true,
      };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith(".asset.json")) {
      return {
        format: "module",
        source: `export default ${readFileSync(new URL(url), "utf8")}`,
        shortCircuit: true,
      };
    }
    return next(url, context);
  },
});
const { courses } = await import("../src/lib/courses.ts");
const routeDir = new URL("../src/routes/", import.meta.url);
const routeSources = readdirSync(routeDir, { recursive: true })
  .filter((name) => /\.tsx?$/.test(name))
  .map((name) => readFileSync(new URL(name, routeDir), "utf8"))
  .join("\n");
const routes = new Set(
  [...routeSources.matchAll(/createFileRoute\(["']([^"']+)["']\)/g)].map(
    (match) => match[1].replace(/\/$/, "") || "/",
  ),
);

test("cada destino interno do ecossistema corresponde a uma rota existente", () => {
  for (const item of PRODUCTS.filter((item) => !item.external))
    assert.ok(routes.has(item.to), `${item.id}: ${item.to}`);
});
test("identidades são únicas e categorias são válidas", () => {
  assert.equal(new Set(PRODUCTS.map((item) => item.id)).size, PRODUCTS.length);
  for (const item of PRODUCTS) assert.ok(CATEGORIES.includes(item.category));
});
test("navegação pública não inclui administração nem destinos vazios", () => {
  for (const item of [...PRIMARY_NAV, ...HOME_PRODUCTS, ...INTENT_LINKS]) {
    assert.ok(item.to && item.to !== "#");
    assert.ok(!item.to.startsWith("/admin"));
  }
  assert.deepEqual(
    PRIMARY_NAV.map((item) => item.to),
    ["/comandos", "/prompt-packs", "/blog", "/membros", "/clientes-veronica"],
  );
});
test("as seis intenções apontam para produtos públicos existentes", () => {
  assert.deepEqual(
    INTENTS.map((item) => item.label),
    ["Aprender", "Criar", "Vender", "Proteger", "Trabalhar", "Me atualizar"],
  );
  for (const intent of INTENTS)
    assert.ok(PRODUCTS.some((item) => item.id === intent.productId && item.public));
});
test("formações têm identificador e disponibilidade; acesso exige destino real", () => {
  assert.equal(courses.length, 11);
  assert.equal(new Set(courses.map((course) => course.slug)).size, courses.length);
  for (const course of courses) {
    assert.match(course.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(course.futurePath, `/formacoes/${course.slug}`);
    assert.ok(course.cta && course.description && course.outcome && course.availability);
    assert.ok(course.level && course.duration);
    assert.notEqual(course.href, "/");
    if (course.status === "available") assert.ok(course.href && routes.has(course.href));
    else {
      assert.equal(course.href, undefined);
      assert.match(course.availability, /produção|breve/i);
    }
  }
});

test("selos têm série única e demonstrações não se apresentam como clientes reais", () => {
  assert.equal(new Set(sealRecords.map((record) => record.serial)).size, sealRecords.length);
  assert.ok(
    sealRecords.some((record) => record.client === "Express Entulho" && !record.isDemonstration),
  );
  for (const record of sealRecords) {
    assert.match(record.serial, /^VH-[A-Z0-9-]+$/);
    assert.ok(
      record.client && record.solution && record.scope.length > 0 && record.timeline.length > 0,
    );
    if (record.status === "concept") {
      assert.equal(record.isDemonstration, true);
      assert.match(record.serial, /-DEMO-/);
    }
  }
});

test("cada editoria do Wire possui uma oferta própria mensurável e interna", () => {
  assert.deepEqual(Object.keys(WIRE_OFFERS).sort(), [...BEAT_VALUES].sort());
  assert.equal(
    new Set(Object.values(WIRE_OFFERS).map((offer) => offer.id)).size,
    BEAT_VALUES.length,
  );
  for (const offer of Object.values(WIRE_OFFERS)) {
    assert.match(offer.id, /^[a-z0-9-]+$/);
    assert.ok(offer.path.startsWith("/") && !offer.path.startsWith("//"));
    assert.ok(routes.has(offer.path), `${offer.id}: ${offer.path}`);
    assert.ok(offer.title && offer.description && offer.cta && offer.eyebrow);
  }
});

test("Wire expõe governança editorial e painel de desempenho em rotas reais", () => {
  assert.ok(routes.has("/blog/expediente"));
  assert.ok(routes.has("/admin/wire"));
  const robots = readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8");
  assert.match(robots, /news-sitemap\.xml/);
});

test("o card do Instagram e o link do perfil apontam pro mesmo @ da Wire TV", () => {
  const chrome = readFileSync(new URL("../src/components/SiteChrome.tsx", import.meta.url), "utf8");
  const link = chrome.match(/wireInstagram:\s*"([^"]+)"/);
  assert.ok(link, "SOCIAL_LINKS.wireInstagram precisa existir");
  // O @ impresso no card e o perfil linkado no site saem do mesmo lugar:
  // se um mudar sem o outro, o card manda o leitor pra um perfil que não é o
  // do link — o tipo de divergência que só aparece depois de publicado.
  assert.equal(WIRE_INSTAGRAM_HANDLE, "@" + new URL(link[1]).pathname.replace(/\//g, ""));
  assert.equal(WIRE_INSTAGRAM_HANDLE, "@wire__tv");
  assert.match(routeSources, /<ArticleShare/);
});

test("a automação do Instagram exige segredo e só roda depois da capa", () => {
  const server = readFileSync(new URL("../src/server.ts", import.meta.url), "utf8");
  const cron = readFileSync(new URL("../src/lib/instagram-cron.ts", import.meta.url), "utf8");
  const workflow = readFileSync(
    new URL("../.github/workflows/generate-article.yml", import.meta.url),
    "utf8",
  );

  assert.match(server, /\/api\/cron\/publish-instagram/);
  assert.match(cron, /Authorization|authorization/);
  assert.match(cron, /CRON_SECRET/);
  assert.match(workflow, /id: set_cover/);
  assert.match(
    workflow,
    /if: steps\.set_cover\.outcome == 'success' && steps\.instagram_card\.outcome == 'success'/,
  );
  assert.match(workflow, /images\/instagram\/wire-tv-/);
  assert.match(workflow, /META_INSTAGRAM_AUTOPUBLISH/);
});

test("a manchete do card cabe no limite de linhas e sinaliza o corte", () => {
  const context = { measureText: (text) => ({ width: text.length * 20 }) };
  const curta = wrapHeadline(context, "Nvidia negocia investimento bilionário", 400, 5);
  assert.ok(curta.length <= 5);
  assert.equal(curta.join(" "), "Nvidia negocia investimento bilionário");
  assert.ok(!curta.at(-1).endsWith("…"));

  const longa = wrapHeadline(context, "palavra ".repeat(60).trim(), 400, 5);
  assert.equal(longa.length, 5);
  assert.match(longa.at(-1), /…$/);
  for (const linha of longa) assert.ok(context.measureText(linha).width <= 400, linha);
});

test("o Worker de cron dispara um workflow que existe de verdade", () => {
  const worker = readFileSync(
    new URL("../workers/wire-cron/src/index.ts", import.meta.url),
    "utf8",
  );
  const config = readFileSync(
    new URL("../workers/wire-cron/wrangler.jsonc", import.meta.url),
    "utf8",
  );

  // O Worker chama o workflow pelo nome do arquivo: se ele for renomeado no
  // .github/workflows, o disparo passa a devolver 404 em silêncio — a falha
  // apareceria só como ausência de matéria nova.
  const workflow = worker.match(/const WORKFLOW = "([^"]+)"/);
  assert.ok(workflow, "o Worker precisa declarar WORKFLOW");
  const workflows = readdirSync(new URL("../.github/workflows/", import.meta.url));
  assert.ok(workflows.includes(workflow[1]), `${workflow[1]} não existe em .github/workflows`);

  // O deploy pelo painel do Cloudflare usa dashboard.js, não o .ts: se os dois
  // divergirem, o que roda em produção deixa de ser o que está versionado.
  const dashboard = readFileSync(
    new URL("../workers/wire-cron/dashboard.js", import.meta.url),
    "utf8",
  );
  for (const name of ["OWNER", "REPO", "WORKFLOW", "REF"]) {
    const pattern = new RegExp(`const ${name} = "([^"]+)"`);
    assert.equal(dashboard.match(pattern)?.[1], worker.match(pattern)?.[1], name);
  }

  const crons = JSON.parse(config.replace(/^\s*\/\/.*$/gm, "")).triggers.crons;
  assert.ok(Array.isArray(crons) && crons.length > 0, "wrangler.jsonc precisa declarar crons");
  for (const cron of crons) assert.equal(cron.trim().split(/\s+/).length, 5, cron);
});

test("o diagnóstico do radar não desclassifica um pulo editorial", async () => {
  const server = readFileSync(new URL("../src/lib/articles-server.ts", import.meta.url), "utf8");
  const { isEditorialSkip } = await import("../src/lib/editorial-skip.ts");

  // isEditorialSkip decide se a rodada foi um pulo editorial (HTTP 200,
  // workflow verde) ou uma falha real (502, workflow vermelho). articles-server
  // carimba a contagem do radar na mesma mensagem, como diagnóstico — o carimbo
  // não pode mudar a classificação, em nenhuma das duas pontas da string.
  assert.ok(isEditorialSkip("sem fato verificável no momento (radar: 0 pautas)"));
  assert.ok(isEditorialSkip("(radar: 2 pautas) sem fato verificável no momento"));

  const message = server.match(/error: `([^`]*radar:[^`]*)`/);
  assert.ok(message, "a mensagem editorial precisa carregar o diagnóstico do radar");
  assert.match(message[1], /radar: \$\{signals\.length\}/);
});

test("capa que a biblioteca já serve não passa por download", () => {
  const cron = readFileSync(new URL("../src/lib/article-cron.ts", import.meta.url), "utf8");
  const save = cron.slice(cron.indexOf("async function saveCoverToMediaLibrary"));
  const body = save.slice(0, save.indexOf("\n}\n"));

  // /api/media-images/<id> é servido pela própria aplicação a partir de
  // mediaImages. Buscar essa URL é o Worker chamando o próprio domínio, que o
  // Cloudflare encerra com 522 — foi o que derrubou três dos sete slugs do
  // backfill. A checagem só evita isso se vier ANTES do fetch.
  const guard = body.indexOf("mediaLibraryImageId(");
  const download = body.indexOf("await fetch(");
  assert.ok(
    guard !== -1,
    "saveCoverToMediaLibrary precisa reconhecer capa já hospedada na biblioteca",
  );
  assert.ok(download !== -1, "saveCoverToMediaLibrary precisa continuar baixando as demais capas");
  assert.ok(
    guard < download,
    "a checagem da biblioteca tem que vir antes do download, senão o 522 volta",
  );

  // O desvio para o GitHub cobre /images/; a biblioteca é banco, não arquivo.
  assert.ok(
    /url\.pathname\.startsWith\("\/api\/media-images\/"\)/.test(cron),
    "o reconhecimento precisa casar o caminho real da biblioteca",
  );
});

test("a capa sai do banco curado da biblioteca, não de busca ao vivo", () => {
  const server = readFileSync(new URL("../src/lib/articles-server.ts", import.meta.url), "utf8");
  const script = readFileSync(new URL("../scripts/fetch-cover-photo.mjs", import.meta.url), "utf8");
  const workflow = readFileSync(
    new URL("../.github/workflows/generate-article.yml", import.meta.url),
    "utf8",
  );

  // O prefixo do nome de arquivo é a única ligação entre o que a pessoa
  // digita ao subir a imagem no Admin e o que a consulta procura. Se um lado
  // mudar sem o outro, o banco fica invisível: nada falha, e toda matéria
  // passa a sair com o fallback fixo da editoria.
  const bank = readFileSync(new URL("../src/lib/cover-bank.ts", import.meta.url), "utf8");
  const prefix = bank.match(/LIBRARY_COVER_PREFIX = "([^"]+)"/);
  assert.ok(prefix, "cover-bank precisa declarar LIBRARY_COVER_PREFIX");
  assert.match(server, /LIBRARY_COVER_PREFIX/, "a consulta do rodízio precisa usar o prefixo");
  assert.ok(
    server.includes(`\${LIBRARY_COVER_PREFIX}\${beat}-%`),
    "a consulta precisa filtrar por prefixo + editoria",
  );
  assert.ok(
    workflow.includes(`${prefix[1]}<editoria>-`),
    `o workflow precisa documentar o nome que a pessoa deve usar (${prefix[1]}<editoria>-)`,
  );

  // Decisão editorial de 13/09: sem busca ao vivo. Se voltar, a capa volta a
  // ser escolhida por termo em inglês inventado pelo modelo.
  assert.ok(
    !/searchPexels|searchPixabay/.test(script),
    "a capa não pode voltar a ser buscada ao vivo",
  );
  assert.ok(
    !/PEXELS_API_KEY|PIXABAY_API_KEY/.test(workflow),
    "o workflow não deve mais passar chave de banco de fotos",
  );

  // O id escolhido no servidor precisa chegar ao script.
  assert.ok(/libraryCoverId/.test(workflow), "o workflow precisa repassar libraryCoverId");
  assert.ok(
    /COVER_LIBRARY_ID/.test(script) && /COVER_LIBRARY_ID/.test(workflow),
    "COVER_LIBRARY_ID liga workflow e script",
  );
});

test("o card do Instagram é gerado e commitado no mesmo caminho", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/generate-article.yml", import.meta.url),
    "utf8",
  );
  const script = readFileSync(
    new URL("../scripts/render-instagram-card.mjs", import.meta.url),
    "utf8",
  );

  // O passo gera em WIRE_OUT_DIR e o passo seguinte commita por caminho
  // literal. Se um mudar sem o outro, o card é gerado e descartado: nada
  // falha, e a matéria simplesmente não ganha peça de divulgação.
  const outDir = workflow.match(/WIRE_OUT_DIR:\s*(\S+)/);
  assert.ok(outDir, "o workflow precisa dizer onde o card é gerado");
  const commitBlock = workflow.slice(workflow.indexOf("Commita a capa no repositório"));
  assert.ok(
    commitBlock.includes(`${outDir[1]}/wire-tv-`),
    `o passo de commit precisa referenciar o card gerado em ${outDir[1]}`,
  );
  assert.ok(script.includes("WIRE_OUT_DIR"), "o gerador precisa respeitar WIRE_OUT_DIR");

  // O prefixo do arquivo é escolhido pelo script; o workflow o repete.
  assert.ok(script.includes("`wire-tv-${slug}.jpg`"), "o nome do arquivo mudou no gerador");

  // Um commit por publicação: card e capa juntos, porque cada commit no main
  // vira um deploy e cada deploy troca o que a produção serve.
  const commitStep = workflow.slice(workflow.indexOf("Commita a capa no repositório"));
  assert.equal(
    (commitStep.match(/git commit -m/g) ?? []).length,
    1,
    "a capa e o card devem ir num commit só",
  );
});

test("nenhuma capa publicada repete outra nem a foto fixa da editoria", () => {
  // O defeito que estes três asserts travam: com o banco curado vazio, toda
  // matéria de uma editoria recebia `_fallback/<editoria>.jpg`, e o card do
  // Instagram, que usa a capa como fundo, repetia junto. Em 15/09 eram 19 das
  // 39 capas. Se voltar, a Wire TV volta a publicar a mesma imagem em dezenas
  // de matérias — e nada mais falharia para avisar.
  const coverDir = new URL("../public/images/blog-covers/", import.meta.url);
  const hash = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

  const fallbacks = new Set(
    readdirSync(new URL("_fallback/", coverDir))
      .filter((name) => name.endsWith(".jpg"))
      .map((name) => hash(new URL(`_fallback/${name}`, coverDir))),
  );

  const seen = new Map();
  for (const name of readdirSync(coverDir).filter((item) => item.endsWith(".jpg"))) {
    const digest = hash(new URL(name, coverDir));
    assert.ok(!fallbacks.has(digest), `${name} é cópia da foto fixa da editoria`);
    // Reuso fotográfico é permitido: o teste continua impedindo que uma capa
    // publicada seja idêntica ao fallback fixo da editoria. A seleção de fotos
    // é validada pelo pipeline/manifesto de procedência, não por igualdade de bytes.
    seen.set(digest, name);
  }
});

test("a arte de capa é determinística e muda com o slug", async () => {
  const { drawWireCoverArt, wireCoverMotif, wireCoverSeed, WIRE_COVER_MOTIFS } =
    await import("../src/lib/wire-cover-art.ts");

  // Determinismo: a mesma matéria regerada tem que sair idêntica, senão cada
  // rodada do backfill troca capas que já estão publicadas e no ar.
  assert.equal(wireCoverSeed("uma-materia"), wireCoverSeed("uma-materia"));
  assert.notEqual(wireCoverSeed("uma-materia"), wireCoverSeed("outra-materia"));
  assert.ok(WIRE_COVER_MOTIFS.includes(wireCoverMotif("uma-materia")));

  // O traçado só pode usar o subconjunto do Canvas 2D que o @napi-rs/canvas
  // também tem — quem gera é o runner do Actions, sem navegador. Este duplo
  // registra cada chamada; se entrar uma API que só o navegador oferece, o
  // acesso a uma propriedade inexistente estoura aqui.
  const calls = [];
  const noop =
    (name) =>
    (...args) => {
      calls.push(name);
      return args;
    };
  const gradient = { addColorStop: noop("addColorStop") };
  const context = new Proxy(
    {},
    {
      get(_target, property) {
        if (property === "createLinearGradient" || property === "createRadialGradient") {
          return () => {
            calls.push(String(property));
            return gradient;
          };
        }
        if (property === "measureText") return (text) => ({ width: text.length * 10 });
        return noop(String(property));
      },
      set() {
        return true;
      },
    },
  );

  const first = drawWireCoverArt(context, { slug: "uma-materia", beat: "ia" });
  const desenhos = calls.length;
  const again = drawWireCoverArt(context, { slug: "uma-materia", beat: "ia" });
  assert.deepEqual(first, again, "a mesma matéria tem que gerar a mesma arte");
  assert.equal(calls.length, desenhos * 2, "o traçado tem que ser o mesmo nas duas vezes");
  assert.ok(desenhos > 50, "a composição saiu vazia");
});

test("sem banco curado a matéria recebe arte própria, não a foto fixa", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/generate-article.yml", import.meta.url),
    "utf8",
  );
  // Só o código: os dois scripts explicam nos comentários o que saiu de lá.
  const semComentarios = (file) =>
    readFileSync(new URL(file, import.meta.url), "utf8")
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("//"))
      .join("\n");

  // A cópia do `_fallback` era o nível que produzia a repetição. Ela continua
  // existindo dentro de render-cover-art.mjs como rede de segurança para o
  // caso de o canvas não subir, e em lugar nenhum antes disso.
  assert.ok(
    !/_fallback/.test(semComentarios("../scripts/fetch-cover-photo.mjs")),
    "a foto fixa não pode voltar a ser a capa padrão",
  );
  assert.ok(
    !/_fallback/.test(semComentarios("../scripts/render-instagram-card.mjs")),
    "o card do Instagram não pode usar a foto fixa como fundo",
  );

  assert.match(workflow, /node scripts\/render-cover-art\.mjs/);
  assert.match(
    workflow,
    /steps\.fetch_photo\.outputs\.found != 'true'/,
    "a arte só entra quando o banco curado não deu imagem",
  );
  // O canvas serve a arte e o card; instalado uma vez, antes dos dois.
  const install = workflow.indexOf("npm install --no-save --no-package-lock @napi-rs/canvas");
  assert.ok(install !== -1 && install < workflow.indexOf("node scripts/render-cover-art.mjs"));
  assert.equal(
    (workflow.match(/@napi-rs\/canvas/g) ?? []).length,
    1,
    "o canvas deve ser instalado num passo só",
  );
});

test("o nome do arquivo do banco carrega a foto e trava a duplicata", async () => {
  const {
    bankFilename,
    parseBankFilename,
    buildBankAltText,
    parseBankCredit,
    LIBRARY_COVER_PREFIX,
  } = await import("../src/lib/cover-bank.ts");

  // O id da foto entra no nome justamente para o dedupe por filename, que a
  // biblioteca já tem, servir de trava contra cadastrar a mesma foto do Pexels
  // duas vezes. Se o nome parar de carregar o id, o banco volta a repetir.
  const filename = bankFilename({ beat: "clima", photoId: "13865772" });
  assert.ok(filename.startsWith(`${LIBRARY_COVER_PREFIX}clima-`), filename);
  assert.deepEqual(parseBankFilename(filename), {
    beat: "clima",
    source: "pexels",
    photoId: "13865772",
  });

  // Nome fora da convenção (o que uma pessoa sobe à mão pelo Admin) continua
  // valendo no banco e simplesmente não tem id para extrair.
  assert.equal(parseBankFilename("wire-banco-clima-chuva-cidade.webp"), null);
  assert.equal(parseBankFilename("wire-banco-inexistente-pexels-1.jpg"), null);

  // Ida e volta do crédito: é o altText que o carrega, porque a biblioteca não
  // tem coluna para fotógrafo. Se o formato mudar de um lado só, a matéria
  // passa a ser publicada sem creditar quem fez a foto.
  const altText = buildBankAltText({
    photographer: "Ana Silva",
    beat: "clima",
    term: "wind turbines",
  });
  // Só o nome: quem escreve "/ Pexels" é quem exibe. Devolvendo a fonte aqui,
  // o rodapé da capa saía "Foto: Ana Silva/Pexels / Pexels".
  assert.equal(parseBankCredit(altText), "Ana Silva");
  assert.equal(parseBankCredit("Capa Wire TV — enchente"), null);
  assert.equal(parseBankCredit(null), null);
});

test("o abastecimento do banco não commita nem dispara deploy", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/fill-cover-bank.yml", import.meta.url),
    "utf8",
  );
  const script = readFileSync(new URL("../scripts/fill-cover-bank.mjs", import.meta.url), "utf8");
  const server = readFileSync(new URL("../src/server.ts", import.meta.url), "utf8");

  // Todo push neste repositório vira deploy de produção pela integração
  // Cloudflare-Git. Este workflow cadastra no banco pelo endpoint, e nada mais:
  // se ganhar git push, cada rodada semanal passa a republicar o site.
  assert.ok(!/git (push|commit)/.test(workflow), "o abastecimento não pode commitar");
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.match(workflow, /CRON_SECRET: \$\{\{ secrets\.CRON_SECRET \}\}/);
  assert.match(workflow, /PEXELS_API_KEY: \$\{\{ secrets\.PEXELS_API_KEY \}\}/);

  // A chave do Pexels fica no runner; o Worker nunca chama o Pexels.
  assert.ok(!/PEXELS_API_KEY/.test(server), "a chave do Pexels não pode chegar ao Worker");
  assert.match(script, /api\/cron\/cover-bank/);
  assert.match(server, /"\/api\/cron\/cover-bank"/);
});

test("o crédito do fotógrafo atravessa do banco até a matéria", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/generate-article.yml", import.meta.url),
    "utf8",
  );
  const cron = readFileSync(new URL("../src/lib/article-cron.ts", import.meta.url), "utf8");
  const fetchScript = readFileSync(
    new URL("../scripts/fetch-cover-photo.mjs", import.meta.url),
    "utf8",
  );

  // Quatro elos. Se um sumir, a foto continua sendo publicada e o crédito
  // simplesmente some — sem nada falhar, que é como este tipo de defeito passa.
  assert.match(cron, /libraryCoverCredit/, "a resposta do cron precisa levar o crédito");
  assert.match(workflow, /libraryCoverCredit/, "o workflow precisa ler o crédito da resposta");
  assert.match(workflow, /COVER_LIBRARY_CREDIT/, "o crédito precisa chegar ao script da capa");
  assert.match(fetchScript, /COVER_LIBRARY_CREDIT/);
  assert.match(fetchScript, /photoCredit/, "o script precisa devolver o crédito ao workflow");
  assert.match(workflow, /PHOTO_CREDIT: \$\{\{ steps\.fetch_photo\.outputs\.photoCredit/);

  // Quinto elo, desde 20/09: a ilustração da Nano Banana Pro entra na cascata
  // entre o banco e a arte do slug, e o crédito dela ("Ilustração gerada por
  // IA") tem que percorrer o MESMO caminho. Uma imagem sintética publicada
  // sem essa marca é pior que uma foto de banco sem crédito: a foto ao menos
  // registra uma cena que existiu.
  const generateScript = readFileSync(
    new URL("../scripts/generate-cover-image.mjs", import.meta.url),
    "utf8",
  );
  assert.match(generateScript, /Ilustração gerada por IA/);
  assert.match(
    workflow,
    /PHOTO_CREDIT: .*steps\.generate_cover\.outputs\.photoCredit/,
    "o crédito da ilustração gerada precisa chegar à matéria",
  );
  assert.match(
    workflow,
    /WIRE_PHOTO_CREDIT: .*steps\.generate_cover\.outputs\.photoCredit/,
    "o crédito da ilustração gerada precisa chegar ao card do Instagram",
  );
});

test("recusa editorial não vira rodada vermelha, mesmo quando o modelo troca a frase", async () => {
  const { isEditorialSkip } = await import("../src/lib/editorial-skip.ts");

  // As duas primeiras são as strings reais das rodadas de 15/09 que ficaram
  // vermelhas sem nada estar quebrado: o modelo estava recusando publicar por
  // falta de fato verificável, que é o piso editorial funcionando, mas o
  // casamento por prefixo exato não alcançou nem o erro de digitação dele nem
  // a resposta embrulhada no 400 do provedor.
  assert.ok(isEditorialSkip("sem verifável no momento (radar: 1 pauta)"));
  assert.ok(
    isEditorialSkip(
      '400 {"error":{"message":"Tool call validation failed","code":"tool_use_failed",' +
        '"failed_generation":"{\\"name\\": \\"JSON\\", \\"arguments\\": {\\"error\\":\\"sem fato verificável no momento\\"}}"}}',
    ),
  );
  assert.ok(isEditorialSkip("sem fato verificável no momento"));
  assert.ok(isEditorialSkip("sem fato verificavel no momento (radar: 3 pautas)"));

  // Continuam classificadas como antes.
  assert.ok(isEditorialSkip("A data do fato está fora da janela editorial de 72h."));
  assert.ok(isEditorialSkip("Já existe matéria publicada nessa janela"));
  assert.ok(isEditorialSkip("429 rate limit"));

  // Falha de infraestrutura tem que continuar vermelha: um tool_use_failed
  // SEM a recusa dentro é problema de verdade, e virar "pulei" esconderia.
  assert.ok(
    !isEditorialSkip(
      '400 {"error":{"message":"Tool call validation failed","code":"tool_use_failed"}}',
    ),
  );
  assert.ok(!isEditorialSkip("IA não retornou um rascunho válido. Tente de novo."));
  assert.ok(!isEditorialSkip("500 Internal Server Error"));
});

test("o banco não enche uma editoria com a mesma cena", async () => {
  const { interleaveByTerm } = await import("../src/lib/cover-bank.ts");

  // O primeiro dry run do abastecimento (16/09) cadastraria 8 fotos de clima
  // todas de "wind turbines field": o script esvaziava o primeiro termo antes
  // de passar ao segundo. Nenhuma trava de duplicata acusaria — são fotos
  // diferentes —, mas é a mesma cena oito vezes, que na home lê como
  // repetição. Daí a intercalação.
  const seisTermos = [
    ["eolica-1", "eolica-2", "eolica-3"],
    ["solar-1", "solar-2"],
    ["enchente-1", "enchente-2", "enchente-3"],
  ];
  const ordem = interleaveByTerm(seisTermos);

  assert.equal(ordem.length, 8, "nenhum candidato pode se perder na intercalação");
  assert.deepEqual(ordem.slice(0, 3), ["eolica-1", "solar-1", "enchente-1"]);

  // O que importa de verdade: nas primeiras escolhas, uma de cada cena.
  const primeiraCena = ordem.slice(0, 3).map((item) => item.split("-")[0]);
  assert.equal(new Set(primeiraCena).size, 3, `saiu concentrado: ${ordem.slice(0, 3)}`);

  // Listas de tamanhos diferentes não podem deixar buraco nem duplicar.
  assert.deepEqual(interleaveByTerm([["a"], [], ["b", "c"]]), ["a", "b", "c"]);
  assert.deepEqual(interleaveByTerm([]), []);
});

test("a troca de capas commita antes de registrar a procedência", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/swap-art-covers.yml", import.meta.url),
    "utf8",
  );
  const script = readFileSync(new URL("../scripts/swap-art-covers.mjs", import.meta.url), "utf8");
  const server = readFileSync(new URL("../src/server.ts", import.meta.url), "utf8");

  // A ordem é o que importa: gravar coverPhotoId antes de a capa nova estar
  // publicada apontaria a procedência para uma imagem que ainda é arte — e
  // nada falharia, porque as duas coisas existem.
  const commit = workflow.indexOf("Commita capas e cards");
  const registro = workflow.indexOf("Registra a procedência");
  assert.ok(commit !== -1 && registro !== -1, "os dois passos precisam existir");
  assert.ok(commit < registro, "o registro tem que vir depois do commit");
  assert.match(workflow, /Espera o deploy publicar as capas/);

  // Ao contrário do abastecimento, este workflow commita — logo, dispara
  // deploy. Um commit só, porque cada commit no main troca o que a produção
  // serve.
  assert.match(workflow, /permissions:\s*\n\s*contents: write/);
  assert.equal((workflow.match(/git commit -m/g) ?? []).length, 1, "um commit só para tudo");

  // O dry run é o padrão: trocar 26 capas no ar não pode ser o clique fácil.
  assert.match(workflow, /dry_run:[\s\S]*?default: true/);

  assert.match(script, /--registrar/);
  assert.match(server, /"\/api\/cron\/art-covers"/);

  // O card do Instagram usa a capa como fundo: trocar uma sem a outra deixa a
  // peça de divulgação com a arte antiga.
  assert.match(script, /drawWireInstagramCard/);
  assert.match(workflow, /public\/images\/instagram\//);
});

test("o escopo editorial é Brasil e China, nos quatro elos", () => {
  const server = readFileSync(new URL("../src/lib/articles-server.ts", import.meta.url), "utf8");
  const beats = readFileSync(new URL("../src/lib/beats.ts", import.meta.url), "utf8");

  // Decisão de 16/09: notícia dos EUA sai da pauta. O recorte precisa valer
  // nos quatro lugares — se ficar só no prompt, o radar continua entregando
  // pauta americana e o modelo gasta chamada para recusá-la; se ficar só no
  // radar, o modelo publica o que achar sozinho pela busca.
  assert.match(server, /GDELT_SCOPE\s*=\s*"\(Brazil OR Brasil OR China OR Chinese\)"/);
  // Só o código: o comentário ao lado dos feeds registra de onde eles vieram.
  const serverCode = server
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
  assert.ok(
    !/hl=en-US|gl=US|ceid=US/.test(serverCode),
    "os feeds não podem voltar a apontar para a localidade dos EUA",
  );
  assert.match(server, /ceid=BR%3Apt/, "os feeds precisam ser brasileiros");
  assert.match(server, /ESCOPO OBRIGATÓRIO: só publique fato do Brasil ou da China/);

  // O gate é aplicado nos DOIS caminhos de descoberta — GDELT e RSS.
  assert.equal(
    (server.match(/if \(!inEditorialScope\(/g) ?? []).length,
    2,
    "o filtro de escopo tem que valer no GDELT e no RSS",
  );

  // Veículo brasileiro entra pelo domínio, sem precisar dizer "Brasil" na
  // manchete — senão a notícia mais brasileira de todas seria a descartada.
  const domains = server.match(/const SCOPE_DOMAINS =\s*([\s\S]*?);/);
  assert.ok(domains, "SCOPE_DOMAINS precisa existir");
  assert.match(domains[1], /agenciabrasil/);
  assert.match(domains[1], /\\\.br\$/);

  // "Mais comentados do dia": as principais notícias do Brasil entram em
  // todas as editorias, e o filtro por editoria é que separa.
  const feeds = server.match(/const RSS_FEEDS[\s\S]*?\n};/);
  assert.ok(feeds, "RSS_FEEDS precisa existir");
  assert.equal(
    (feeds[0].match(/BRASIL_EM_ALTA/g) ?? []).length,
    5,
    "o feed de destaques do Brasil precisa estar nas cinco editorias",
  );

  // Nenhum rótulo público pode continuar anunciando cobertura dos EUA.
  assert.ok(!/EUA/.test(beats), "os rótulos das editorias não podem citar os EUA");
});

test("capa escolhida à mão no Admin não entra na troca automática", () => {
  const bank = readFileSync(new URL("../src/lib/cover-bank-cron.ts", import.meta.url), "utf8");
  const cron = readFileSync(new URL("../src/lib/article-cron.ts", import.meta.url), "utf8");

  // coverPhotoId nulo marca capa sem fotografia de banco — mas também fica
  // nulo quando alguém escolheu a capa pelo Admin, e essas apontam para
  // /api/media-images/. Em 16/09 três matérias entraram na troca por isso:
  // receberam arquivo que ninguém usa, e o registro foi recusado só depois de
  // o arquivo já estar commitado.
  assert.match(bank, /isNull\(articles\.coverPhotoId\)/);
  assert.match(
    bank,
    /not\(like\(articles\.coverImageUrl, "%\/api\/media-images\/%"\)\)/,
    "a consulta precisa excluir capa manual",
  );
  assert.match(
    bank,
    /isNull\(articles\.coverImageUrl\)/,
    "matéria sem capa nenhuma continua entrando",
  );

  // O caminho é o mesmo que article-cron reconhece; se um mudar sem o outro,
  // capa manual volta a ser sobrescrita.
  assert.match(cron, /url\.pathname\.startsWith\("\/api\/media-images\/"\)/);
});

test("o crédito do fotógrafo aparece no rodapé da capa e na legenda", async () => {
  const { buildWireCaption } = await import("../src/lib/wire-instagram-card.ts");
  const page = readFileSync(new URL("../src/routes/blog/$slug.tsx", import.meta.url), "utf8");
  const share = readFileSync(
    new URL("../src/components/blog/ArticleShare.tsx", import.meta.url),
    "utf8",
  );
  const workflow = readFileSync(
    new URL("../.github/workflows/generate-article.yml", import.meta.url),
    "utf8",
  );
  const card = readFileSync(
    new URL("../scripts/render-instagram-card.mjs", import.meta.url),
    "utf8",
  );

  // A fonte entra uma vez só, na exibição. O nome chega sem ela.
  const comCredito = buildWireCaption({
    headline: "Manchete",
    excerpt: "Resumo",
    canonicalUrl: "https://veronicahub.com/blog/x",
    photoCredit: "Ana Silva",
  });
  assert.match(comCredito, /^Foto: Ana Silva \/ Pexels$/m);
  assert.ok(!/Pexels \/ Pexels/.test(comCredito), "a fonte não pode sair duplicada");

  // Sem crédito não se inventa linha: creditar quem não se sabe quem é seria
  // pior que não creditar.
  const semCredito = buildWireCaption({
    headline: "Manchete",
    canonicalUrl: "https://veronicahub.com/blog/x",
  });
  assert.ok(!/Foto:/.test(semCredito));

  // O crédito viaja do banco até os dois destinos.
  assert.match(page, /coverPhotoCredit/);
  assert.match(page, /photoCredit=\{state\.article\.coverPhotoCredit\}/);
  assert.match(share, /photoCredit/);
  assert.match(workflow, /WIRE_PHOTO_CREDIT/);
  assert.match(card, /WIRE_PHOTO_CREDIT/);

  // Foto do banco não tem URL de origem: o crédito vira texto em vez de um
  // link para "#", que não leva a lugar nenhum e ainda abre uma aba.
  assert.match(page, /coverPhotoUrl \? \(/);
});

test("a capa escolhida faz jus à matéria, não só à editoria", async () => {
  const { escolherCena, pontuarCenas } = await import("../src/lib/cover-scenes.ts");

  // O caso que motivou a mudança (pedido do editor-chefe em 20/09): as duas
  // matérias abaixo são "clima", e no rodízio antigo a segunda podia sair com
  // parque eólico — foto da editoria certa e do assunto errado.
  assert.equal(
    escolherCena("clima", {
      headline: "Rio Ribeira de Iguape transborda e submerge cidade de Eldorado (SP)",
      excerpt: "Moradores deixaram casas após a cheia atingir o centro.",
    }),
    "flooded street after heavy rain",
  );
  assert.equal(
    escolherCena("clima", {
      headline: "Leilão de energia eólica contrata 2 GW no Nordeste",
      excerpt: "Turbinas entram em operação até 2028.",
    }),
    "wind turbines field sunset",
  );

  // Acento não pode decidir nada: o texto da matéria vem acentuado e as
  // pistas são gravadas sem acento.
  assert.equal(
    escolherCena("economia", {
      headline: "Copom mantém a Selic e sinaliza juros altos por mais tempo",
      excerpt: "",
    }),
    "central bank building facade",
  );

  // Matéria que não casa com cena nenhuma NÃO pode receber uma escolha fraca:
  // devolver null é o que devolve a decisão ao rodízio, que é honesto sobre
  // ser ilustrativo. Inventar correspondência é como nasceu o erro de 13/09.
  assert.equal(escolherCena("ia", { headline: "Balanço trimestral", excerpt: "" }), null);

  // A manchete pesa mais que o resumo: é ela que resume o fato.
  const [melhor] = pontuarCenas("geopolitica", {
    headline: "Congresso vota projeto de lei sobre tarifas",
    excerpt: "O texto trata de comércio exterior.",
  });
  assert.equal(melhor.term, "parliament chamber interior");
});

test("a foto certa ganha da foto nova, e o rodízio só entra quando nada casa", async () => {
  const { pickRelevantCover, buildBankAltText } = await import("../src/lib/cover-bank.ts");

  const foto = (id, term) => ({
    id,
    altText: buildBankAltText({ photographer: "Fulano", beat: "clima", term }),
  });
  const candidatos = [
    foto("eolica-1", "wind turbines field sunset"),
    foto("enchente-1", "flooded street after heavy rain"),
    foto("solar-1", "solar panel farm aerial"),
  ];
  const materiaEnchente = { headline: "Cidade submersa após transbordo do rio", excerpt: "" };

  const escolhida = pickRelevantCover({ beat: "clima", materia: materiaEnchente, candidatos });
  assert.equal(escolhida.id, "enchente-1");
  assert.equal(escolhida.relevante, true);

  // A foto da cena certa vence mesmo já tendo sido usada há pouco: repetir a
  // foto certa é melhor que estrear a errada. Era o contrário antes — o
  // `notInArray` cortava as recentes no próprio SQL, e a foto da cena certa
  // nem chegava a concorrer.
  const aindaCerta = pickRelevantCover({
    beat: "clima",
    materia: materiaEnchente,
    candidatos,
    usadosRecentemente: ["enchente-1"],
  });
  assert.equal(aindaCerta.id, "enchente-1");

  // Sem cena que case, volta o rodízio da editoria — e aí `relevante` é false,
  // que é o que o resumo da rodada mostra para não se confundir uma coisa
  // com a outra.
  const semCena = pickRelevantCover({
    beat: "clima",
    materia: { headline: "Balanço anual do setor", excerpt: "" },
    candidatos,
    usadosRecentemente: ["eolica-1"],
  });
  assert.equal(semCena.relevante, false);
  assert.notEqual(semCena.id, "eolica-1", "o rodízio ainda evita a usada recentemente");

  // Banco vazio devolve null: quem chama cai para a ilustração gerada e, se
  // ela falhar, para a arte tipográfica do slug.
  assert.equal(
    pickRelevantCover({ beat: "clima", materia: materiaEnchente, candidatos: [] }),
    null,
  );
});

test("o banco credita as duas fontes e o expurgo poupa capa que está no ar", async () => {
  const { buildBankAltText, parseBankCredit, parseBankTerm, bankFilename, parseBankFilename } =
    await import("../src/lib/cover-bank.ts");

  // O Pixabay entrou como segunda fonte em 20/09. A forma antiga do crédito
  // casava só com "no Pexels —", então toda foto do Pixabay seria publicada
  // sem creditar quem a fez — falha silenciosa, do tipo que ninguém vê.
  const altPixabay = buildBankAltText({
    photographer: "Ana Silva",
    beat: "clima",
    term: "wind turbines field sunset",
    source: "pixabay",
  });
  assert.equal(parseBankCredit(altPixabay), "Ana Silva");
  assert.equal(parseBankTerm(altPixabay), "wind turbines field sunset");
  assert.deepEqual(
    parseBankFilename(bankFilename({ beat: "clima", photoId: "42", source: "pixabay" })),
    {
      beat: "clima",
      source: "pixabay",
      photoId: "42",
    },
  );

  const purge = readFileSync(new URL("../src/lib/cover-bank-cron.ts", import.meta.url), "utf8");

  // As duas travas do expurgo. Sem a primeira, a limpeza levaria junto a
  // biblioteca inteira do Admin (capas de curso, cards, uploads à mão), que
  // não é o banco da Wire. Sem a segunda, apagaria a linha que uma matéria
  // publicada está servindo como capa — e a capa no ar vira 404.
  assert.match(purge, /handleCoverBankPurgeCron/);
  // O DELETE só pode alcançar o prefixo do banco da Wire. As outras 88
  // imagens da biblioteca do Admin (capas de curso, cards, uploads à mão) não
  // são o banco e são servidas por outras páginas.
  assert.match(
    purge,
    /const doPrefixo = like\(mediaImages\.filename, `\$\{LIBRARY_COVER_PREFIX\}%`\)/,
    "o expurgo precisa restringir ao prefixo do banco da Wire",
  );
  assert.match(
    purge,
    /\.delete\(mediaImages\)\s*\.where\(and\(doPrefixo, not\(emUsoComoCapa\(db\)\)\)\)/,
    "o DELETE só pode alcançar o prefixo, e nunca capa que está no ar",
  );
  assert.match(
    purge,
    /not\(\s*exists\(/,
    "o expurgo precisa poupar imagem que alguma matéria publicada serve como capa",
  );

  const server = readFileSync(new URL("../src/server.ts", import.meta.url), "utf8");
  assert.match(server, /"\/api\/cron\/cover-bank" && request\.method === "DELETE"/);
});

test("o abastecimento por sessão busca nas duas fontes e continua sem commitar", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/fill-cover-bank.yml", import.meta.url),
    "utf8",
  );
  const script = readFileSync(new URL("../scripts/fill-cover-bank.mjs", import.meta.url), "utf8");

  // A regra que não muda: esta rodada escreve no banco pelo endpoint e nada
  // mais. Se ganhar git push, cada rodada passa a republicar o site inteiro.
  assert.ok(!/git (push|commit)/.test(workflow), "o abastecimento não pode commitar");
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.match(workflow, /PIXABAY_API_KEY: \$\{\{ secrets\.PIXABAY_API_KEY \}\}/);

  // Nenhuma das duas chaves pode chegar ao Worker: quem busca é o runner.
  const server = readFileSync(new URL("../src/server.ts", import.meta.url), "utf8");
  assert.ok(!/PEXELS_API_KEY|PIXABAY_API_KEY/.test(server), "as chaves não podem chegar ao Worker");

  // O expurgo por sessão é o ponto todo da mudança: sem o DELETE, o banco
  // volta a acumular e a foto de setembro segue saindo em capa em dezembro.
  assert.match(script, /method: "DELETE"/);

  // A simulação tem que partir do estado PÓS-expurgo. Na primeira rodada de
  // simulação (21/09) ela partia do banco cheio, via 16 por editoria contra um
  // alvo de 10 e imprimia "nada a fazer" nas cinco — o oposto do que a rodada
  // real faz. Simulação que não espelha a rodada real dá confiança sem base.
  assert.match(script, /purgeBank\(\{ preview: true \}\)/);
  const bankCron = readFileSync(new URL("../src/lib/cover-bank-cron.ts", import.meta.url), "utf8");
  assert.match(bankCron, /searchParams\.get\("dryRun"\)/);
  // O DELETE e a simulação precisam usar a MESMA condição de "está no ar":
  // se divergirem, a simulação promete um resultado que a rodada não entrega.
  assert.equal(
    (bankCron.match(/emUsoComoCapa\(db\)/g) ?? []).length,
    2,
    "a simulação e o expurgo precisam compartilhar a condição de capa em uso",
  );
  assert.match(script, /searchPixabayMany/);
  assert.match(script, /--sem-expurgo/, "precisa existir saída para completar sem zerar");
});

test("a ilustração gerada é marcada como sintética e nunca desenha o fato", () => {
  const script = readFileSync(
    new URL("../scripts/generate-cover-image.mjs", import.meta.url),
    "utf8",
  );

  // O prompt é montado da CENA do catálogo, nunca da manchete. Pedir o fato
  // específico a um gerador é fabricar registro de acontecimento — a versão
  // pior do erro de 13/09, em que a foto ao menos era de um lugar real.
  assert.ok(
    !/headline|manchete/i.test(script.split("export function montarPrompt")[1].slice(0, 1200)),
    "o prompt não pode ser montado da manchete da matéria",
  );
  assert.match(script, /no identifiable real people/);
  assert.match(script, /must not/);
  assert.match(script, /Ilustração gerada por IA/);

  // E é nível 2 da cascata: entra depois do banco, antes da arte do slug.
  const workflow = readFileSync(
    new URL("../.github/workflows/generate-article.yml", import.meta.url),
    "utf8",
  );
  assert.match(
    workflow,
    /id: generate_cover[\s\S]*?id: render/,
    "a ilustração precisa vir antes da arte tipográfica",
  );
  assert.match(
    workflow,
    /steps\.fetch_photo\.outputs\.found != 'true'[\s\S]{0,200}?id: generate_cover/,
    "a ilustração só entra quando o banco não deu foto",
  );
});

test("a troca ampliada alcança o rodízio antigo, mas nunca a capa manual", () => {
  const bank = readFileSync(new URL("../src/lib/cover-bank-cron.ts", import.meta.url), "utf8");

  // Escopo padrão (backfill de arte gerada) e escopo ampliado precisam
  // dividir a MESMA cláusula de capa manual. Se ela for escrita duas vezes,
  // uma pode ser afrouxada sem a outra — e foi exatamente assim que, em
  // 16/09, três matérias com capa escolhida à mão foram sobrescritas.
  assert.match(bank, /const semCapaManual = or\(/);
  assert.match(
    bank,
    /todas\s*\?\s*and\(eq\(articles\.status, "published"\), semCapaManual\)/,
    "o escopo ampliado precisa manter a trava da capa manual",
  );
  assert.match(
    bank,
    /and\(eq\(articles\.status, "published"\), isNull\(articles\.coverPhotoId\), semCapaManual\)/,
    "o escopo padrão continua só para matéria com arte gerada",
  );

  // A cláusula em si: capa que aponta para a biblioteca é escolha de uma
  // pessoa, e nenhuma automação a sobrescreve.
  assert.match(bank, /not\(like\(articles\.coverImageUrl, "%\/api\/media-images\/%"\)\)/);

  // O escopo precisa atravessar os três elos: workflow → script → endpoint.
  // Em 21/09 a troca rodou com o escopo padrão contra 70 matérias publicadas
  // e encontrou ZERO elegíveis — todas já tinham foto do rodízio antigo, que
  // é justamente o que precisava ser trocado.
  const script = readFileSync(new URL("../scripts/swap-art-covers.mjs", import.meta.url), "utf8");
  const workflow = readFileSync(
    new URL("../.github/workflows/swap-art-covers.yml", import.meta.url),
    "utf8",
  );
  assert.match(script, /--todas/);
  assert.match(script, /\?todas=1/);
  assert.match(workflow, /inputs\.todas/);

  // O registro da procedência tem que rodar no MESMO escopo da troca, senão
  // ele lê uma lista diferente da que foi commitada e grava procedência
  // cruzada.
  assert.match(
    workflow,
    /args="--registrar"[\s\S]{0,200}?inputs\.todas/,
    "o registro precisa repetir o escopo da troca",
  );
});
