// Worker de cron da Wire TV. Não serve tráfego: a única coisa que ele faz é,
// no horário, mandar o GitHub rodar o workflow que gera e publica a matéria.
//
// Por que ele existe: o agendador do GitHub é best-effort e descarta disparo.
// Medido no repositório com dois horários por hora (48 disparos/dia
// esperados): 9 rodadas em 11/09, 15 em 12/09, 6 em 13/09 — nenhuma no minuto
// pedido, com buracos de até 5h15. O Cron Trigger do Cloudflare dispara de
// verdade; o GitHub continua sendo quem executa o pipeline, porque é lá que
// estão as chaves do Pexels e o passo que commita a capa no repositório.
//
// Por que um Worker separado e não o `scheduled` do Worker do site: o site é
// construído pelo nitro através do preset da Lovable, que gera a configuração
// de deploy sozinho — não há arquivo do wrangler no repositório onde declarar
// `triggers`, e mexer no entry do site arrisca o build de uma aplicação que
// publica em produção a cada push. Este Worker tem 40 linhas e falha sozinho.

const OWNER = "Veronica-01Git";
const REPO = "veronicahub-app";
const WORKFLOW = "generate-article.yml";
const REF = "main";

// Tipados aqui, estruturalmente, em vez de depender de @cloudflare/workers-types:
// é o único uso de tipo do runtime neste arquivo, e assim o Worker não precisa
// de package.json, tsconfig nem node_modules — o wrangler empacota direto.
type ExecutionContext = { waitUntil(promise: Promise<unknown>): void };

type Env = {
  // Token fine-grained do GitHub com permissão Actions: write neste
  // repositório. Configurado por `wrangler secret put GITHUB_TOKEN`.
  GITHUB_TOKEN: string;
};

async function dispatchWorkflow(env: Env): Promise<void> {
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
  async scheduled(_event: unknown, env: Env, ctx: ExecutionContext): Promise<void> {
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
