// Gêmeo em JavaScript de src/index.ts, para colar no editor do painel do
// Cloudflare (dash.cloudflare.com → Workers & Pages → wire-tv-cron → Edit
// code). O editor do painel não processa TypeScript, então esta cópia existe
// sem os tipos — o comportamento é idêntico, linha a linha.
//
// Por que existe um caminho pelo painel: publicar por `wrangler deploy` exige
// Node instalado na máquina, o que nem sempre é o caso. Pelo painel o Worker,
// o secret e o Cron Trigger são criados no navegador.
//
// SE VOCÊ MUDAR src/index.ts, MUDE AQUI TAMBÉM — enquanto o deploy for pelo
// painel, é este arquivo que corresponde ao que está rodando de verdade.
//
// O que ele faz: no horário, manda o GitHub rodar generate-article.yml, que
// gera a matéria e busca a capa. Existe porque o agendador de cron do GitHub
// descarta disparo (medido: 6 a 15 rodadas por dia contra 48 esperadas, com
// buracos de até 5h15).

const OWNER = "Veronica-01Git";
const REPO = "veronicahub-app";
const WORKFLOW = "generate-article.yml";
const REF = "main";

async function dispatchWorkflow(env) {
  if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN não configurado no Worker.");

  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        // A API do GitHub recusa requisição sem User-Agent.
        "User-Agent": "wire-tv-cron/1.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: REF }),
    },
  );

  // 204 é o sucesso desta rota; ela não devolve corpo.
  if (response.status !== 204) {
    throw new Error(`GitHub recusou o disparo (${response.status}): ${await response.text()}`);
  }
}

export default {
  async scheduled(_event, env, ctx) {
    // waitUntil mantém o Worker vivo até a chamada terminar; sem isso o
    // runtime pode encerrar a invocação antes da resposta do GitHub.
    ctx.waitUntil(
      dispatchWorkflow(env).catch((error) => {
        console.error("Falha ao disparar o pipeline editorial:", error);
        throw error;
      }),
    );
  },
};
