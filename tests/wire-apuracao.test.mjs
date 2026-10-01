// Apuração no servidor do Wire (src/lib/wire-apuracao.ts) — 01/10/2026.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  escolherPautas,
  extrairTexto,
  lerFeed,
  pareceMateria,
  textoCombinaComTitulo,
} from "../src/lib/wire-apuracao.ts";

const AGORA = Date.parse("2026-10-01T15:00:00Z");
const hora = (h) => new Date(AGORA - h * 3_600_000).toUTCString();

const feed = (itens) =>
  `<rss><channel>${itens
    .map(
      ([titulo, url, h]) =>
        `<item><title><![CDATA[${titulo}]]></title><link>${url}</link><pubDate>${hora(h)}</pubDate><description>&lt;p&gt;resumo&lt;/p&gt;</description></item>`,
    )
    .join("")}</channel></rss>`;

test("lê o feed com a URL real, o domínio e a data", () => {
  const [item] = lerFeed(
    feed([
      ["BR-101 terá bloqueio de faixa em Balneário Camboriú", "https://www.jornalrazao.com/a", 2],
    ]),
  );
  assert.equal(item.titulo, "BR-101 terá bloqueio de faixa em Balneário Camboriú");
  assert.equal(item.dominio, "jornalrazao.com");
  assert.equal(item.publicadaEm, AGORA - 2 * 3_600_000);
  assert.equal(item.resumo, "resumo");
});

test("dois portais com o mesmo fato vêm antes da fonte única; prioridade e frescor contam", () => {
  const candidatas = [
    ...lerFeed(
      feed([
        [
          "BR-101 terá faixa bloqueada nesta noite para obra em Balneário Camboriú",
          "https://ndmais.com.br/1",
          3,
        ],
        ["Feira de livros movimenta Joinville neste fim de semana", "https://ndmais.com.br/2", 1],
        ["Notícia velha de Itajaí sobre o porto e a dragagem", "https://ndmais.com.br/3", 80],
      ]),
    ),
    ...lerFeed(
      feed([
        [
          "BR-101 terá bloqueio de faixa nesta quinta-feira em Balneário Camboriú",
          "https://www.jornalrazao.com/x",
          2,
        ],
        ["VÍDEO: Bom dia Santa Catarina", "https://g1.globo.com/sc/videos/abc", 1],
      ]),
    ),
  ];
  const pautas = escolherPautas(candidatas, {
    agora: AGORA,
    janelaHoras: 48,
    prioridade: /balne[áa]rio|itaja/i,
    limite: 4,
  });
  assert.equal(pautas[0].fontes.length, 2, "o par vem primeiro");
  assert.deepEqual(pautas[0].fontes.map((f) => f.dominio).sort(), [
    "jornalrazao.com",
    "ndmais.com.br",
  ]);
  const urls = pautas.flatMap((p) => p.fontes.map((f) => f.url));
  assert.ok(!urls.includes("https://ndmais.com.br/3"), "fora da janela de 48h");
  assert.ok(!urls.includes("https://g1.globo.com/sc/videos/abc"), "página de vídeo não é matéria");
  assert.ok(urls.includes("https://ndmais.com.br/2"), "fonte única continua valendo");
});

test("mesmo portal não conta como par", () => {
  const candidatas = lerFeed(
    feed([
      [
        "Prefeitura de Itajaí abre matrículas da rede municipal de ensino",
        "https://ndmais.com.br/a",
        1,
      ],
      [
        "Prefeitura de Itajaí abre matrículas na rede municipal de ensino",
        "https://ndmais.com.br/b",
        2,
      ],
    ]),
  );
  const pautas = escolherPautas(candidatas, { agora: AGORA, janelaHoras: 48, limite: 4 });
  assert.ok(pautas.every((p) => p.fontes.length === 1));
});

test("extrai o texto do <article> e pula menu, script e repetição", () => {
  const paragrafo =
    "A Prefeitura de Itajaí anunciou nesta quarta-feira a abertura das matrículas da rede municipal, com 4 mil vagas.";
  const html = `<html><nav><p>${"Menu do portal com muitos links e chamadas de outras matérias ".repeat(2)}</p></nav>
    <script>var p = "<p>não</p>";</script>
    <article><h1>Título</h1><p>${paragrafo}</p><p>${paragrafo}</p><p>curto</p>
    <p>${"As inscrições vão até o dia 20 e podem ser feitas pela internet ou nas escolas. ".repeat(30)}</p></article></html>`;
  const texto = extrairTexto(html);
  assert.ok(texto.startsWith(paragrafo));
  assert.equal(texto.split(paragrafo).length - 1, 1, "parágrafo repetido sai uma vez");
  assert.ok(!texto.includes("Menu do portal"));
  assert.ok(!texto.includes("não</p>"));
  assert.ok(texto.length <= 3_000);
});

test("texto que não é da matéria do título é recusado", () => {
  const titulo = "Prefeitura de Itajaí abre matrículas da rede municipal";
  assert.ok(
    textoCombinaComTitulo(
      titulo,
      "A Prefeitura de Itajaí abre hoje as matrículas da rede municipal.",
    ),
  );
  assert.ok(
    !textoCombinaComTitulo(
      titulo,
      "Posso votar de camisa com propaganda? Eleitores vão dar 6 votos.",
    ),
  );
});

test("páginas de vídeo, ao vivo e edição não viram pauta", () => {
  assert.ok(!pareceMateria("https://g1.globo.com/sc/santa-catarina/ao-vivo/assista.ghtml"));
  assert.ok(!pareceMateria("https://g1.globo.com/sc/santa-catarina/edicao/2026/10/01/x.ghtml"));
  assert.ok(!pareceMateria("https://ndmais.com.br/video/giro-de-noticias/"));
  assert.ok(pareceMateria("https://ndmais.com.br/noticias/obra-na-br-101-em-bc/"));
});

test("o cron não cai na busca na web; só o rascunho manual usa", () => {
  const server = readFileSync(new URL("../src/lib/articles-server.ts", import.meta.url), "utf8");
  assert.match(server, /draftArticleContent\(data\.beat, \{ permitirBusca: true \}\)/);
  assert.match(server, /draftArticleContent\(beat, \{ recentes \}\)/);
  // A matéria registra as URLs que o servidor abriu.
  assert.match(server, /sourceUrls: fontes\.map\(\(f\) => f\.candidata\.url\)/);
  // A apuração no servidor não pede ferramenta: é o que mantém a rodada barata.
  const escrever = server.slice(server.indexOf("async function escreverComFontes"));
  const chamada = escrever.slice(0, escrever.indexOf("} catch"));
  assert.doesNotMatch(chamada, /browser_search|tools:/);
});

test("assunto repetido: mesmo fato com manchete diferente é barrado; assuntos diferentes passam", async () => {
  const { assuntoRepetido } = await import("../src/lib/wire-apuracao.ts");
  // Textos reais de 01/10/2026 (resumidos): o mesmo negócio, Lynas + Meteoric.
  const lynas = {
    titulo: "Austrália compra projeto de terras raras em Minas Gerais por US$ 672 milhões",
    texto:
      "Austrália compra projeto de terras raras em Minas Gerais por US$ 672 milhões. A australiana Lynas vai comprar a Meteoric Resources, dona do projeto Caldeira, em Poços de Caldas.",
  };
  const outras = [
    {
      titulo: "Defesa Civil do Rio Grande do Sul emite alerta",
      texto: "A Defesa Civil do Rio Grande do Sul emitiu alerta para Porto Alegre e São Paulo.",
    },
    // Nomes comuns aparecem em várias matérias da janela — é a frequência
    // que os desqualifica, como no acervo real.
    {
      titulo: "Ventos fortes no Rio Grande do Sul",
      texto:
        "Ventos deixam casas sem luz no Rio Grande do Sul; a Defesa Civil atende Porto Alegre.",
    },
    {
      titulo: "Frente fria chega a São Paulo",
      texto:
        "A frente fria passa por Porto Alegre e chega a São Paulo, diz a Defesa Civil do Rio Grande do Sul.",
    },
    {
      titulo: "BC mantém juros",
      texto:
        "O Banco Central manteve a Selic, segundo o Copom, em decisão sobre Política Monetária.",
    },
  ];
  const nova =
    "Brasil atrai bilhão de dólares com projeto de terras raras em Poços de Caldas. Segundo a InfoMoney, a Lynas comprou a Meteoric Resources, dona do projeto Caldeira, em Minas Gerais.";
  assert.equal(assuntoRepetido(nova, [lynas, ...outras]), lynas.titulo);

  const diferente =
    "Chuva forte atinge Porto Alegre. A Defesa Civil do Rio Grande do Sul pede atenção em São Paulo também.";
  assert.equal(assuntoRepetido(diferente, [lynas, ...outras]), null);
});

test("assunto repetido é pulo editorial", async () => {
  const { isEditorialSkip } = await import("../src/lib/editorial-skip.ts");
  assert.ok(isEditorialSkip('Assunto repetido de uma publicação recente: "X".'));
});
