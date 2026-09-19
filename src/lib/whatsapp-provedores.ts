/**
 * De onde vem a inteligência da agente — e só isso.
 *
 * A regra do projeto é "o modelo propõe, o código decide". Este arquivo é a
 * metade do "propõe": ele fala com os provedores de LLM e devolve texto cru.
 * Nada aqui sabe o que é preço, cidade ou caçamba. A conferência do que pode
 * sair está em whatsapp-agent.ts, e continua valendo qualquer que seja o
 * provedor — trocar de modelo nunca pode virar permissão para cotar errado.
 *
 * POR QUE UMA CADEIA, E NÃO UM PROVEDOR SÓ. Em 19/09 a agente ficou muda duas
 * vezes no mesmo dia: primeiro porque os nomes de modelo configurados não
 * existiam mais (404), depois porque a cota gratuita acabou no meio de uma
 * conversa de teste (429). Nos dois casos o cliente recebeu "vou confirmar com
 * a equipe" por motivo de infraestrutura, não de negócio. Uma cadeia de
 * provedores independentes — contas diferentes, cobranças diferentes, limites
 * diferentes — é o que faz uma dessas falhas não virar silêncio.
 *
 * A ORDEM É DELIBERADA. A Anthropic entra como principal porque é conta paga
 * com limite previsível, e porque este agente vive de seguir regra estrita sob
 * pressão do cliente ("me dá um desconto, senão fecho com o concorrente"). A
 * Groq fica de reserva: é grátis, então quando ela falha por cota ninguém
 * perde dinheiro, e quando a Anthropic estiver fora ela ainda atende.
 */

import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";

export type Mensagem = { readonly role: "user" | "assistant"; readonly content: string };

export type Provedor = {
  readonly nome: string;
  readonly modelo: string;
  /** Há credencial para este provedor no runtime? */
  readonly configurado: () => boolean;
  /** Texto da resposta, ou string vazia quando o modelo não produziu nada. */
  readonly responder: (system: string, mensagens: readonly Mensagem[]) => Promise<string>;
  /** Frase curta em português para o painel. Nunca vaza corpo de erro inteiro. */
  readonly resumirErro: (error: unknown) => string;
};

/**
 * Orçamento de saída. Folgado de propósito para um agente que responde em três
 * frases: nos modelos com raciocínio o teto cobre **também os tokens de
 * raciocínio**, que vêm antes do texto. Com um teto apertado o raciocínio
 * consome tudo e a resposta chega vazia — foi exatamente o que aconteceu em
 * 19/09 com "entulho e gesso, quais valores de cada uma?". Quem limita o
 * tamanho da resposta é o prompt, não este número.
 */
const MAX_TOKENS = 2048;

/* ------------------------------------------------------------- anthropic */

/**
 * Modelo principal. Trocável por variável de ambiente para que mudar de
 * modelo não exija deploy — a lição dos dois incidentes de 19/09 é que o nome
 * do modelo é a peça que mais quebra e a que mais custa para consertar.
 *
 * O padrão é Opus 5. Se o custo por conversa pesar, `claude-haiku-4-5` é
 * bem mais barato (US$ 1 / US$ 5 por milhão de tokens de entrada / saída,
 * contra US$ 5 / US$ 25) e dá conta de um atendimento com regras explícitas.
 * É decisão de quem paga a conta, não do código: basta apontar a variável.
 */
const MODELO_ANTHROPIC = process.env.ANTHROPIC_MODEL_AGENTE ?? "claude-opus-5";

/**
 * O Haiku 4.5 não aceita `output_config.effort` — devolve erro. Os modelos da
 * família Opus/Sonnet 5 aceitam, e para atender obra "low" é o certo: resposta
 * curta e rápida. A decisão difícil desta agente (cotar ou não) não é do
 * modelo, é da guarda, então não há o que raciocinar longamente aqui.
 */
function configDeEsforco(modelo: string): { effort: "low" } | undefined {
  return modelo.startsWith("claude-haiku") ? undefined : { effort: "low" };
}

export const PROVEDOR_ANTHROPIC: Provedor = {
  nome: "Anthropic",
  modelo: MODELO_ANTHROPIC,

  configurado: () => Boolean(process.env.ANTHROPIC_API_KEY),

  async responder(system, mensagens) {
    const client = new Anthropic();
    const esforco = configDeEsforco(MODELO_ANTHROPIC);

    // Diferença de formato que morde quem vem de API estilo OpenAI: aqui o
    // system prompt é PARÂMETRO DE TOPO, não a primeira mensagem do array.
    // Mandá-lo como mensagem faria o modelo tratar as regras de preço como
    // fala de cliente — exatamente o que não pode acontecer neste agente.
    const resposta = await client.messages.create({
      model: MODELO_ANTHROPIC,
      max_tokens: MAX_TOKENS,
      system,
      ...(esforco ? { output_config: { effort: esforco.effort } } : {}),
      messages: mensagens.map((m) => ({ role: m.role, content: m.content })),
    });

    // Recusa por segurança chega como HTTP 200, não como exceção. Tratada
    // como falha de propósito: quem assume é a reserva, e o cliente recebe
    // uma resposta em vez de silêncio.
    if (resposta.stop_reason === "refusal") {
      throw new Error(`recusa do modelo (${resposta.stop_details?.category ?? "sem categoria"})`);
    }

    // content é união discriminada: texto, raciocínio, uso de ferramenta. Só
    // os blocos de texto viram resposta ao cliente.
    return resposta.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  },

  resumirErro(error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return "a Anthropic recusou a chave (401) — ANTHROPIC_API_KEY inválida ou revogada";
    }
    if (error instanceof Anthropic.PermissionDeniedError) {
      return "a Anthropic recusou o acesso (403) — chave sem permissão ou conta sem crédito";
    }
    if (error instanceof Anthropic.NotFoundError) {
      return `modelo ${MODELO_ANTHROPIC} não encontrado na Anthropic (404) — confira o identificador`;
    }
    if (error instanceof Anthropic.RateLimitError) {
      return `limite da Anthropic atingido (429) no modelo ${MODELO_ANTHROPIC}`;
    }
    if (error instanceof Anthropic.APIError) {
      return `a Anthropic respondeu ${error.status}`;
    }
    const msg = error instanceof Error ? error.message : String(error);
    return `falha ao chamar a Anthropic: ${msg.slice(0, 120)}`;
  },
};

/* ------------------------------------------------------------------ groq */

/**
 * Modelos comprovados, não lembrados. São os que articles-server.ts roda em
 * produção com a mesma GROQ_API_KEY — a defesa contra o 404 de 19/09, que
 * nasceu de escolher nome de modelo de cabeça.
 */
export const MODELO_GROQ_PRINCIPAL = "openai/gpt-oss-120b";
export const MODELO_GROQ_RESERVA = "openai/gpt-oss-20b";

function provedorGroq(modelo: string): Provedor {
  return {
    nome: `Groq (${modelo})`,
    modelo,
    configurado: () => Boolean(process.env.GROQ_API_KEY),

    async responder(system, mensagens) {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const resposta = await groq.chat.completions.create({
        model: modelo,
        max_completion_tokens: MAX_TOKENS,
        reasoning_effort: "low",
        // Aqui, ao contrário da Anthropic, o system vai como primeira mensagem.
        messages: [{ role: "system", content: system }, ...mensagens],
      });
      return (resposta.choices[0]?.message?.content ?? "").trim();
    },

    resumirErro(error) {
      const status = (error as { status?: number } | null)?.status;
      if (status === 429)
        return `cota da Groq esgotada (429) no modelo ${modelo} — na Groq o teto é por modelo`;
      if (status === 401 || status === 403) return `a Groq recusou a chave (${status})`;
      if (status === 404) return `modelo ${modelo} não encontrado na Groq (404)`;
      if (typeof status === "number") return `a Groq respondeu ${status}`;
      const msg = error instanceof Error ? error.message : String(error);
      return `falha ao chamar a Groq: ${msg.slice(0, 120)}`;
    },
  };
}

export const PROVEDOR_GROQ = provedorGroq(MODELO_GROQ_PRINCIPAL);
export const PROVEDOR_GROQ_RESERVA = provedorGroq(MODELO_GROQ_RESERVA);

/**
 * A cadeia, em ordem de tentativa. Provedor sem credencial é pulado sem gastar
 * uma chamada — assim quem ainda não tem chave da Anthropic continua atendido
 * pela Groq, e quem tem as duas ganha a reserva de graça.
 */
export const CADEIA_DE_PROVEDORES: readonly Provedor[] = [
  PROVEDOR_ANTHROPIC,
  PROVEDOR_GROQ,
  PROVEDOR_GROQ_RESERVA,
];
