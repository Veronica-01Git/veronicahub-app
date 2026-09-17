/**
 * Por que a agente cai no caminho offline — respondido em um comando.
 *
 * O PR #113 já mostra o motivo na tela do chat. O problema é o custo de
 * perguntar: para ler o motivo é preciso abrir a demonstração e mandar uma
 * mensagem, o que gasta uma conversa inteira do modelo. E a demonstração é a
 * página que o cliente abre — não serve como instrumento de medição.
 *
 * Este endpoint troca isso por uma sonda de UM token: a menor chamada que a
 * Groq aceita, só para colher o status que ela devolve. Responde três
 * perguntas que a tela não separa:
 *
 *   1. O Worker enxerga a GROQ_API_KEY? (segredo configurado é uma coisa;
 *      chegar em `process.env` dentro do runtime é outra)
 *   2. Qual modelo a agente pede — porque na Groq a cota diária é POR MODELO,
 *      e o pipeline de matérias usa outro (ver whatsapp-agent.ts).
 *   3. O que a Groq respondeu de fato: 429 de cota, 401 de chave, 404 de
 *      modelo inexistente, ou nada de errado.
 *
 * A chave nunca sai daqui, nem inteira nem em pedaço. O que sai é um booleano.
 */

import Groq from "groq-sdk";
import { MODELO_AGENTE, resumirErro } from "./whatsapp-agent";

export type Diagnostico = {
  /** O runtime enxerga o segredo? Não diz nada sobre o valor dele. */
  readonly chaveVisivel: boolean;
  readonly modelo: string;
  /** A Groq aceitou a chamada? Quando `false`, `motivo` diz por quê. */
  readonly nucleoRespondeu: boolean;
  /** Status HTTP devolvido pela Groq, quando houve um. */
  readonly status: number | null;
  readonly motivo: string | null;
  readonly verificadoEm: string;
};

/** Menor chamada possível: um token de saída, uma palavra de entrada. */
async function sondarGroq(apiKey: string): Promise<void> {
  const groq = new Groq({ apiKey });
  await groq.chat.completions.create({
    model: MODELO_AGENTE,
    max_completion_tokens: 1,
    messages: [{ role: "user", content: "ok" }],
  });
}

/**
 * A sonda é injetável para que o teste não dependa de rede nem de chave —
 * o que importa verificar é a leitura do resultado, não a Groq.
 */
export async function diagnosticar(
  sonda: (apiKey: string) => Promise<void> = sondarGroq,
  chave: string | undefined = process.env.GROQ_API_KEY,
): Promise<Diagnostico> {
  const verificadoEm = new Date().toISOString();

  if (!chave) {
    return {
      chaveVisivel: false,
      modelo: MODELO_AGENTE,
      nucleoRespondeu: false,
      status: null,
      motivo: "GROQ_API_KEY não configurada",
      verificadoEm,
    };
  }

  try {
    await sonda(chave);
    return {
      chaveVisivel: true,
      modelo: MODELO_AGENTE,
      nucleoRespondeu: true,
      status: 200,
      motivo: null,
      verificadoEm,
    };
  } catch (error) {
    const status = (error as { status?: number } | null)?.status;
    return {
      chaveVisivel: true,
      modelo: MODELO_AGENTE,
      nucleoRespondeu: false,
      status: typeof status === "number" ? status : null,
      motivo: resumirErro(error),
      verificadoEm,
    };
  }
}

/**
 * `GET /api/whatsapp/diagnostico`, com o mesmo `CRON_SECRET` que os demais
 * endpoints de operação. Protegido não porque vaze segredo — não vaza — mas
 * porque cada chamada consome cota da Groq, e cota é justamente o recurso
 * sob suspeita.
 */
export async function handleWhatsAppDiagnostico(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("CRON_SECRET não configurada", { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const diagnostico = await diagnosticar();
  return new Response(JSON.stringify(diagnostico, null, 2), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
