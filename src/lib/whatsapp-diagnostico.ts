/**
 * Por que a agente parou — respondido em um comando, sem abrir a demonstração.
 *
 * O PR #113 já mostra o motivo na tela do chat. O problema é o custo de
 * perguntar: para ler o motivo é preciso abrir a demonstração, que é a página
 * que o cliente abre, e gastar uma conversa inteira do modelo. Este endpoint
 * troca isso por sondas mínimas, e responde as duas perguntas que derrubam
 * uma agente de WhatsApp na prática:
 *
 *   1. A Groq aceita a nossa chave? (cota, chave recusada, modelo inexistente)
 *   2. O token da Meta ainda vale?
 *
 * A SEGUNDA EXISTE POR UM MOTIVO ESPECÍFICO. O token que a tela
 * "Configuração da API" da Meta entrega é TEMPORÁRIO — vale 24 horas. Um
 * token gerado na véspera de uma demonstração já está morto na hora da
 * reunião, e o sintoma é a agente recebendo a mensagem e não conseguindo
 * responder, que é o pior momento possível para descobrir. Só token de
 * Usuário do Sistema pode ser permanente.
 *
 * Nenhuma chave e nenhum token saem na resposta, nem em pedaço. O que sai é
 * um booleano, um status HTTP e uma frase em português.
 */

import Groq from "groq-sdk";
import { MODELO_AGENTE, resumirErro } from "./whatsapp-agent";
import { getWhatsAppConfig } from "./whatsapp-cloud";

export type SondaGroq = {
  /** O runtime enxerga o segredo? Não diz nada sobre o valor dele. */
  readonly chaveVisivel: boolean;
  readonly modelo: string;
  readonly respondeu: boolean;
  readonly status: number | null;
  readonly motivo: string | null;
};

export type SondaWhatsApp = {
  readonly configurado: boolean;
  readonly respondeu: boolean;
  readonly status: number | null;
  readonly motivo: string | null;
};

export type Diagnostico = {
  readonly groq: SondaGroq;
  readonly whatsapp: SondaWhatsApp;
  readonly verificadoEm: string;
};

/* ------------------------------------------------------------------- groq */

/** Menor chamada possível: um token de saída, uma palavra de entrada. */
async function sondarGroq(apiKey: string): Promise<void> {
  const groq = new Groq({ apiKey });
  await groq.chat.completions.create({
    model: MODELO_AGENTE,
    max_completion_tokens: 1,
    messages: [{ role: "user", content: "ok" }],
  });
}

export async function diagnosticarGroq(
  sonda: (apiKey: string) => Promise<void> = sondarGroq,
  chave: string | undefined = process.env.GROQ_API_KEY,
): Promise<SondaGroq> {
  const base = { modelo: MODELO_AGENTE };
  if (!chave) {
    return {
      ...base,
      chaveVisivel: false,
      respondeu: false,
      status: null,
      motivo: "GROQ_API_KEY não configurada",
    };
  }
  try {
    await sonda(chave);
    return { ...base, chaveVisivel: true, respondeu: true, status: 200, motivo: null };
  } catch (error) {
    const status = (error as { status?: number } | null)?.status;
    return {
      ...base,
      chaveVisivel: true,
      respondeu: false,
      status: typeof status === "number" ? status : null,
      motivo: resumirErro(error),
    };
  }
}

/* --------------------------------------------------------------- whatsapp */

/**
 * Lê o próprio número na Graph API. É a chamada mais barata que prova que o
 * token vale: não envia mensagem, não toca em conversa de ninguém, e devolve
 * 401 quando o token expirou.
 */
async function sondarWhatsApp(config: {
  phoneNumberId: string;
  accessToken: string;
  graphVersion: string;
}): Promise<number> {
  const resposta = await fetch(
    `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}?fields=id`,
    { headers: { authorization: `Bearer ${config.accessToken}` } },
  );
  return resposta.status;
}

/** Traduz o status da Graph sem nunca ecoar o corpo — erro de auth vaza token. */
function motivoDaGraph(status: number): string | null {
  if (status === 200) return null;
  if (status === 401)
    return "a Meta recusou o token (401) — provavelmente expirou; o token da tela Configuração da API vale 24h";
  if (status === 403) return "a Meta recusou o token (403) — permissão faltando ou app sem revisão";
  if (status === 190) return "token inválido ou expirado (190)";
  if (status === 404) return "WHATSAPP_PHONE_NUMBER_ID não encontrado na Meta (404)";
  return `a Meta respondeu ${status}`;
}

export async function diagnosticarWhatsApp(
  sonda: (config: {
    phoneNumberId: string;
    accessToken: string;
    graphVersion: string;
  }) => Promise<number> = sondarWhatsApp,
  config = getWhatsAppConfig(),
): Promise<SondaWhatsApp> {
  if (!config) {
    return {
      configurado: false,
      respondeu: false,
      status: null,
      motivo: "WHATSAPP_PHONE_NUMBER_ID ou WHATSAPP_ACCESS_TOKEN não configurados",
    };
  }
  try {
    const status = await sonda(config);
    return {
      configurado: true,
      respondeu: status === 200,
      status,
      motivo: motivoDaGraph(status),
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      configurado: true,
      respondeu: false,
      status: null,
      motivo: `falha ao falar com a Meta: ${msg.slice(0, 120)}`,
    };
  }
}

/* ----------------------------------------------------------------- junção */

export async function diagnosticar(): Promise<Diagnostico> {
  // Em paralelo: são independentes e o endpoint é chamado por gente esperando.
  const [groq, whatsapp] = await Promise.all([diagnosticarGroq(), diagnosticarWhatsApp()]);
  return { groq, whatsapp, verificadoEm: new Date().toISOString() };
}

/**
 * `GET /api/whatsapp/diagnostico`, com o mesmo `CRON_SECRET` dos demais
 * endpoints de operação. Protegido não porque vaze segredo — não vaza — mas
 * porque cada chamada consome cota da Groq, e cota é um dos suspeitos.
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
