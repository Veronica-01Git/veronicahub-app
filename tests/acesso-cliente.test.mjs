import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

/**
 * O portão do endereço oficial do cliente.
 *
 * Estes testes não chamam `verificarAcessoCliente` porque ela toca banco e
 * sessão — o que exigiria subir infraestrutura para provar coisas que são
 * verificáveis lendo o arquivo. E o que mais importa aqui é justamente
 * estrutural: que NENHUM e-mail esteja escrito no código, e que a ordem das
 * checagens não deixe um caminho aberto.
 */

const fonte = await readFile(
  new URL("../src/lib/acesso-cliente-core.server.ts", import.meta.url),
  "utf8",
);
const ponte = await readFile(
  new URL("../src/lib/acesso-cliente-server.ts", import.meta.url),
  "utf8",
);
const env = await readFile(new URL("../.env.example", import.meta.url), "utf8");

test("nenhum e-mail fica escrito no código de acesso", () => {
  // Qualquer coisa com @ e um ponto depois. Um e-mail em commit fica
  // indexado e raspado para sempre, e revogar exigiria deploy.
  const achados = fonte.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? [];
  assert.deepEqual(achados, [], `e-mail encontrado no código: ${achados.join(", ")}`);
});

test(".env.example documenta as duas listas e não traz valor nenhum", () => {
  for (const chave of ["ACESSO_EXPRESS_ENTULHO", "ACESSO_UNIVERSAL"]) {
    assert.ok(env.includes(chave), `${chave} não documentada`);
    // A linha tem de terminar logo depois do "=": exemplo versionado com
    // e-mail dentro é o mesmo vazamento, num arquivo mais fácil de esquecer.
    const linha = env.split("\n").find((l) => l.startsWith(`${chave}=`));
    assert.equal(linha, `${chave}=`, `${chave} veio com valor preenchido no exemplo`);
  }
});

test("o acesso é por identidade — sem porta por segredo em link", () => {
  // Se algum dia alguém acrescentar um "?t=" aqui, "somente o dono" deixa de
  // ser verdade e passa a ser "quem tem o link".
  assert.ok(
    !fonte.includes("searchParams"),
    "acesso do cliente passou a ler parâmetro de URL — isso é segredo em link, não identidade",
  );
  assert.ok(fonte.includes("getSessionUserId"), "a verificação deixou de olhar a sessão");
});

test("a lista de liberados nunca é devolvida ao navegador", () => {
  // Página de acesso negado que conta quem entra é uma lista de alvos.
  assert.ok(!ponte.includes("emailsLiberados"), "a ponte devolveria a lista de e-mails");
  assert.ok(!ponte.includes("ACESSO_"), "nome de variável de acesso vazou para a ponte");
});

test("a tela não importa o núcleo de servidor direto", async () => {
  // A regressão que custou uma tela quebrada em 22/09: importar o núcleo —
  // que toca sessão e banco — dentro de componente de cliente passa no tsc
  // E no build, e só morre no navegador. Fica travado aqui porque nenhuma
  // das duas verificações automáticas pega.
  const layout = await readFile(
    new URL("../src/routes/clientes/express-entulho/operacoes.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(
    !layout.includes("acesso-cliente-core"),
    "a tela voltou a importar o núcleo de servidor direto — vai quebrar no navegador",
  );
  assert.ok(
    ponte.includes('await import("./acesso-cliente-core.server")'),
    "a ponte deixou de carregar o núcleo por import() dinâmico",
  );
});

test("o painel do cliente saiu do índice de busca", async () => {
  const layout = await readFile(
    new URL("../src/routes/clientes/express-entulho/operacoes.tsx", import.meta.url),
    "utf8",
  );
  assert.match(layout, /noindex/, "espaço de cliente voltou a ser indexável");
  // E o portão precisa estar antes do painel: se o Outlet aparecer sem a
  // checagem, o conteúdo pisca na tela de quem não tem acesso.
  assert.ok(
    layout.indexOf("if (!acesso.ok)") < layout.indexOf("<Outlet />"),
    "o painel é montado antes da verificação de acesso",
  );
});

test("a listagem de clientes continua pública", async () => {
  const listagem = await readFile(
    new URL("../src/routes/clientes/index.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(!listagem.includes("noindex"), "a vitrine de clientes ficou escondida");
});
