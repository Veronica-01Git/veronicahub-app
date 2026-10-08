/**
 * Conexão do número da agente — painel de conferência e o botão que registra
 * o webhook na 360dialog. Só para a administradora do Hub.
 *
 * POR QUE EXISTE. O registro do webhook exige a D360_API_KEY e o segredo
 * WHATSAPP_WEBHOOK_TOKEN. Fazê-lo por linha de comando significaria alguém
 * copiar a chave para fora da Cloudflare — por chat, por terminal, por
 * descuido. Aqui o servidor lê as duas do próprio ambiente e fala com a
 * 360dialog: ninguém vê, copia ou digita segredo nenhum.
 *
 * O QUE NUNCA SAI DAQUI: a chave, o segredo, ou qualquer pedaço deles. As
 * respostas dizem só "configurado / não configurado" e "certo / errado".
 *
 * Não envia mensagem, não lê conversa e não toca no número: só diz à
 * 360dialog para onde mandar os avisos (ver docs/coexistence-express.md).
 */

import { createServerFn } from "@tanstack/react-start";

const SLUG_EXPRESS = "express-entulho";
const HOST_360 = "https://waba-v2.360dialog.io";
export const URL_WEBHOOK_PRODUCAO = "https://veronicahub.com/api/whatsapp/webhook";

/** Conta do workspace da Express E administradora do Hub. As duas. */
async function eAdministradora(): Promise<boolean> {
  const { avaliarAcessoAoWorkspace } = await import("@/features/private-clients/access.server");
  if (!(await avaliarAcessoAoWorkspace(SLUG_EXPRESS)).ok) return false;
  const { requireAdminCore } = await import("@/lib/admin-core.server");
  return (await requireAdminCore()) !== null;
}

export type EstadoConexao = {
  readonly provedor360: boolean;
  readonly chave360: boolean;
  readonly segredoWebhook: boolean;
  readonly envioLiberado: boolean;
  /** null = não deu para consultar (sem chave, ou 360dialog fora). */
  readonly webhook: { readonly urlCerta: boolean; readonly cabecalhoSecreto: boolean } | null;
  readonly avisoWebhook: string | null;
};

type ConfigWebhook = { url?: string; headers?: Record<string, string> };

async function consultarWebhook(
  chave: string,
): Promise<{ ok: true; config: ConfigWebhook } | { ok: false; erro: string }> {
  try {
    const r = await fetch(`${HOST_360}/v1/configs/webhook`, {
      headers: { "D360-API-KEY": chave },
    });
    if (r.status === 401 || r.status === 403) {
      return { ok: false, erro: `a 360dialog recusou a chave (${r.status})` };
    }
    if (r.status === 404) return { ok: true, config: {} };
    if (!r.ok) return { ok: false, erro: `a 360dialog respondeu ${r.status}` };
    return { ok: true, config: ((await r.json().catch(() => ({}))) ?? {}) as ConfigWebhook };
  } catch {
    return { ok: false, erro: "não consegui falar com a 360dialog" };
  }
}

function avaliarWebhook(config: ConfigWebhook): { urlCerta: boolean; cabecalhoSecreto: boolean } {
  return {
    urlCerta: config.url === URL_WEBHOOK_PRODUCAO,
    cabecalhoSecreto: Object.keys(config.headers ?? {}).some(
      (h) => h.toLowerCase() === "x-veronica-webhook-token",
    ),
  };
}

/** `null` para quem não é administradora: o cartão nem aparece. */
export const estadoConexaoWhatsApp = createServerFn({ method: "GET" }).handler(
  async (): Promise<EstadoConexao | null> => {
    if (!(await eAdministradora())) return null;
    const { provedorWhatsApp, TAMANHO_MINIMO_TOKEN_WEBHOOK } = await import("@/lib/whatsapp-cloud");

    const chave = process.env.D360_API_KEY ?? "";
    const segredo = process.env.WHATSAPP_WEBHOOK_TOKEN ?? "";
    let webhook: EstadoConexao["webhook"] = null;
    let avisoWebhook: string | null = null;

    if (chave) {
      const consulta = await consultarWebhook(chave);
      if (consulta.ok) webhook = avaliarWebhook(consulta.config);
      else avisoWebhook = consulta.erro;
    }

    return {
      provedor360: provedorWhatsApp() === "360dialog",
      chave360: Boolean(chave),
      segredoWebhook: segredo.length >= TAMANHO_MINIMO_TOKEN_WEBHOOK,
      envioLiberado: process.env.WHATSAPP_ENVIO_LIBERADO === "sim-o-dono-aprovou",
      webhook,
      avisoWebhook,
    };
  },
);

/**
 * Diz à 360dialog: avisos deste número vão para o nosso webhook, sempre com
 * o nosso segredo no cabeçalho. Idempotente — apertar duas vezes não estraga.
 */
export const registrarWebhook360 = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ ok: true } | { ok: false; erro: string }> => {
    if (!(await eAdministradora())) return { ok: false, erro: "Acesso só da administradora." };
    const { provedorWhatsApp, TAMANHO_MINIMO_TOKEN_WEBHOOK } = await import("@/lib/whatsapp-cloud");

    if (provedorWhatsApp() !== "360dialog") {
      return { ok: false, erro: "Falta WHATSAPP_PROVEDOR=360dialog na Cloudflare." };
    }
    const chave = process.env.D360_API_KEY ?? "";
    if (!chave) return { ok: false, erro: "Falta a D360_API_KEY na Cloudflare." };
    const segredo = process.env.WHATSAPP_WEBHOOK_TOKEN ?? "";
    if (segredo.length < TAMANHO_MINIMO_TOKEN_WEBHOOK) {
      return {
        ok: false,
        erro: `Falta o WHATSAPP_WEBHOOK_TOKEN na Cloudflare (mínimo ${TAMANHO_MINIMO_TOKEN_WEBHOOK} caracteres).`,
      };
    }

    try {
      const r = await fetch(`${HOST_360}/v1/configs/webhook`, {
        method: "POST",
        headers: { "D360-API-KEY": chave, "content-type": "application/json" },
        body: JSON.stringify({
          url: URL_WEBHOOK_PRODUCAO,
          headers: { "x-veronica-webhook-token": segredo },
        }),
      });
      if (r.status === 401 || r.status === 403) {
        return {
          ok: false,
          erro: `A 360dialog recusou a chave (${r.status}). Confira a D360_API_KEY.`,
        };
      }
      if (!r.ok)
        return { ok: false, erro: `A 360dialog respondeu ${r.status}. Nada foi alterado aqui.` };
      return { ok: true };
    } catch {
      return { ok: false, erro: "Não consegui falar com a 360dialog. Tente de novo em instantes." };
    }
  },
);
