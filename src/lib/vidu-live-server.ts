// Sessão ao vivo da Veronica via Vidu S2-Avatar Realtime (WebRTC/AliRTC).
//
// Contrato conferido contra a spec oficial da ShengShu
// (github.com/shengshu-ai/vidu-s-api, skills/vidu-s-api/), que é o que o
// README do github.com/shengshu-ai/Vidu-S aponta como fonte do S2:
//   POST /live/s_avatar/realtime  -> abre sessão, devolve live.id + rtc.*
//   GET  /live/v1/lives/{live_id} -> status, billed_seconds, credits_cost
// Auth: header `Authorization: Token vda_xxx` — a chave NUNCA sai daqui.
//
// CUIDADO AO MEXER: o S1 e o S2 são produtos diferentes, com doc separada.
// A primeira versão disto usava `POST /live/v1/lives`, que é o endpoint do
// S1 (platform.vidu.com/docs/vidu-s1) — o produto pedido é o S2-Avatar e o
// path de criação é outro. Só o GET de status é compartilhado. Não troque
// nenhum destes dois por um path "parecido" sem reler a spec.
//
// Canal de controle: `/live/ws/live/connect?live_id=...&conn_id=...`, com o
// mesmo header de auth, o que navegador não consegue mandar ao abrir um
// WebSocket. Resolvido por relay server-side: src/lib/vidu-live-relay.ts,
// rota /api/vidu/live-relay. A spec é explícita que a chave é server-side
// e nunca vai pro browser.
//
// Preço e imagem do avatar seguem placeholders explícitos (ver TODOs) —
// não são preço/asset aprovados, só valores seguros pra não deixar sessão
// rodando de graça ou por tempo indefinido enquanto isso não é confirmado.

import { createServerFn } from "@tanstack/react-start";
import { eq, sql, and, gte } from "drizzle-orm";
import { getDb } from "./db";
import { users, ledgerEntries } from "./schema";
import { getSessionUserId } from "./session";
import { VERONICA_SKILLS, getVeronicaStep, type VeronicaSkillId } from "@/veronica/skills";

// ===== Config (fixo no servidor — nunca vem do cliente) =====

const VIDU_ENVIRONMENT = process.env.VIDU_ENVIRONMENT === "china" ? "china" : "global";
const VIDU_HOST = VIDU_ENVIRONMENT === "china" ? "api.vidu.cn" : "api.vidu.com";

// TODO(Verônica): trocar pelo preço real depois de ver quanto o Vidu cobra
// por billed_seconds no seu plano. Esse valor é só um teto conservador.
const LIVE_SESSION_PRICE_CENTS_PER_MINUTE = 490; // R$4,90/min — CONFIRMAR
// Teto de tempo da sessão. A seção Avatar da spec NÃO documenta
// idle_timeout_seconds, então não mandamos o campo (mandar campo não
// documentado é chute). O teto vira duas coisas reais: o tamanho do hold
// aqui, e um timer no cliente que encerra a chamada — ver
// VeronicaLiveAvatar. maxSessionMinutes vai na resposta pra os dois nunca
// saírem de sincronia.
const MAX_SESSION_MINUTES = 6;

// TODO(Verônica): confirmar direitos de uso comercial da imagem antes de
// trocar isso — ver conversa. Até lá, mantém o holograma atual como imagem
// de referência do avatar (não é a imagem final).
const VERONICA_AVATAR_IMAGE_URI =
  process.env.VIDU_AVATAR_IMAGE_URI ??
  "https://veronicahub.com/images/assistente/avatar-hologram.webp";

// TODO(Verônica): depois de rodar POST /live/v1/voices/clone com uma amostra
// da voz ElevenLabs (ELEVENLABS_VOICE_ID) já em produção, trocar "Tina"
// (voz default do Vidu) pelo id clonado, via env var.
const VERONICA_VIDU_VOICE = process.env.VIDU_VOICE_ID ?? "Tina";

// Razões do ledger. O hold nasce "pending" (ainda não temos a liveId do
// Vidu) e vira `...:hold:<liveId>` assim que a sessão abre — é essa linha
// que prova, no estorno, quanto foi segurado e de qual usuário.
const HOLD_REASON_PENDING = "live_session:veronica:hold";
const holdReasonFor = (liveId: string) => `live_session:veronica:hold:${liveId}`;
const refundReasonFor = (liveId: string) => `live_session:veronica:refund_unused:${liveId}`;

function buildPersona(skillId: VeronicaSkillId, stepId: string | null): string {
  const skill = VERONICA_SKILLS[skillId];
  const step = getVeronicaStep(skillId, stepId);
  return step
    ? `${skill.systemPrompt}\n\nPASSO ATUAL DO USUÁRIO: "${step.title}" (${step.order}/7).\nContexto específico deste passo: ${step.instructorContext}`
    : skill.systemPrompt;
}

type ViduRtcCredentials = {
  app_id: string;
  channel_id: string;
  user_id: string;
  token: string;
  token_expire_at: string;
};

// ===== startVeronicaLiveSession =====

const startValidator = (input: unknown) => {
  const data = input as { skillId?: unknown; stepId?: unknown };
  if (
    data?.skillId !== "studio-criativo" &&
    data?.skillId !== "curriculo-certo" &&
    data?.skillId !== "home"
  ) {
    throw new Error("Skill inválida.");
  }
  const stepId = typeof data?.stepId === "string" ? data.stepId : null;
  return { skillId: data.skillId as VeronicaSkillId, stepId };
};

export const startVeronicaLiveSession = createServerFn({ method: "POST" })
  .validator(startValidator)
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) {
      return { ok: false as const, error: "login_required" as const };
    }

    const apiKey = process.env.VIDU_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Avatar ao vivo indisponível no momento." };
    }

    const db = getDb();

    // Débito estimado ANTES de abrir a sessão (mesmo padrão de
    // generateNanoBanana em wallet-server.ts) — nunca confia em custo
    // calculado depois de gastar. Reconciliado em endVeronicaLiveSession.
    const estimateCents = LIVE_SESSION_PRICE_CENTS_PER_MINUTE * MAX_SESSION_MINUTES;
    const [debit] = await db
      .update(users)
      .set({ balanceCents: sql`${users.balanceCents} - ${estimateCents}` })
      .where(and(eq(users.id, userId), gte(users.balanceCents, estimateCents)))
      .returning();

    if (!debit) {
      return { ok: false as const, error: "insufficient_funds" as const };
    }

    const [hold] = await db
      .insert(ledgerEntries)
      .values({
        userId,
        deltaCents: -estimateCents,
        reason: HOLD_REASON_PENDING,
      })
      .returning({ id: ledgerEntries.id });

    try {
      const res = await fetch(`https://${VIDU_HOST}/live/s_avatar/realtime`, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // "audio", nunca "video": o avatar responde em vídeo, mas não
          // pedimos câmera de quem visita o site.
          call_mode: "audio",
          avatar: {
            image_uri: VERONICA_AVATAR_IMAGE_URI,
            persona: buildPersona(data.skillId, data.stepId),
            name: "Veronica",
            voice: VERONICA_VIDU_VOICE,
            persona_enhance: false,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Vidu respondeu ${res.status}`);
      }

      const json = (await res.json()) as {
        live: { id: string; status: string };
        rtc: ViduRtcCredentials;
      };

      // Carimba a liveId na linha do hold. É ela que endVeronicaLiveSession
      // lê pra saber quanto foi segurado e de quem — o valor do estorno
      // nunca pode vir do cliente (ver comentário lá embaixo).
      await db
        .update(ledgerEntries)
        .set({ reason: holdReasonFor(json.live.id) })
        .where(eq(ledgerEntries.id, hold.id));

      return {
        ok: true as const,
        liveId: json.live.id,
        rtc: json.rtc,
        estimateCents,
        maxSessionMinutes: MAX_SESSION_MINUTES,
      };
    } catch (error) {
      // Sessão não abriu — estorna o hold integral, não faz sentido cobrar.
      await db
        .update(users)
        .set({ balanceCents: sql`${users.balanceCents} + ${estimateCents}` })
        .where(eq(users.id, userId));
      await db.insert(ledgerEntries).values({
        userId,
        deltaCents: estimateCents,
        reason: "live_session:veronica:refund_failed_start",
      });
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Falha ao iniciar sessão ao vivo.",
      };
    }
  });

// ===== endVeronicaLiveSession =====

const endValidator = (input: unknown) => {
  const data = input as { liveId?: unknown };
  if (typeof data?.liveId !== "string" || !data.liveId) {
    throw new Error("liveId inválido.");
  }
  return { liveId: data.liveId };
};

// Reconcilia o hold inicial com o custo real (billed_seconds/credits_cost)
// devolvido pelo Vidu. Se a consulta falhar, mantém o hold integral em vez
// de devolver crédito sem confirmação do que foi realmente consumido.
export const endVeronicaLiveSession = createServerFn({ method: "POST" })
  .validator(endValidator)
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) {
      return { ok: false as const, error: "Sessão inválida." };
    }

    const apiKey = process.env.VIDU_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Configuração ausente." };
    }

    const db = getDb();
    const holdReason = holdReasonFor(data.liveId);
    const refundReason = refundReasonFor(data.liveId);

    // Quanto foi segurado vem do LEDGER, nunca do cliente. O estorno é
    // `hold - custo real`, então um estimateCents mandado pelo navegador
    // seria crédito de graça pra quem postasse um número grande. A mesma
    // linha também prova a posse: liveId de outro usuário não acha hold
    // nenhum aqui e não estorna coisa alguma.
    const [hold] = await db
      .select({ deltaCents: ledgerEntries.deltaCents })
      .from(ledgerEntries)
      .where(and(eq(ledgerEntries.userId, userId), eq(ledgerEntries.reason, holdReason)))
      .limit(1);

    if (!hold) {
      return { ok: false as const, error: "Sessão ao vivo não encontrada." };
    }
    const holdCents = Math.abs(hold.deltaCents);

    try {
      const res = await fetch(
        `https://${VIDU_HOST}/live/v1/lives/${encodeURIComponent(data.liveId)}`,
        {
          headers: { Authorization: `Token ${apiKey}` },
        },
      );
      if (!res.ok) {
        throw new Error(`Vidu respondeu ${res.status}`);
      }

      const json = (await res.json()) as { billed_seconds?: number; credits_cost?: number };
      const billedSeconds = json.billed_seconds ?? MAX_SESSION_MINUTES * 60;
      const realCents = Math.ceil((billedSeconds / 60) * LIVE_SESSION_PRICE_CENTS_PER_MINUTE);
      const refundCents = Math.max(0, holdCents - realCents);

      if (refundCents > 0) {
        // Insere a linha de estorno só se ainda não existir uma pra esta
        // liveId, na mesma instrução — é isso que torna a reconciliação
        // idempotente. Sem isso, dois cleanup() concorrentes (desligar a
        // chamada e desmontar o componente logo depois) estornariam duas
        // vezes. O driver HTTP do Neon não tem transação interativa (ver
        // db.ts), então a atomicidade tem que caber em uma query só.
        const claim = (await db.execute(sql`
          INSERT INTO "LedgerEntry" ("id", "userId", "deltaCents", "reason")
          SELECT ${crypto.randomUUID()}, ${userId}, ${refundCents}, ${refundReason}
          WHERE NOT EXISTS (
            SELECT 1 FROM "LedgerEntry"
            WHERE "userId" = ${userId} AND "reason" = ${refundReason}
          )
          RETURNING "id"
        `)) as unknown as { rows?: unknown[] };

        // Só devolve saldo se ESTA chamada ganhou o claim acima.
        if ((claim.rows?.length ?? 0) > 0) {
          await db
            .update(users)
            .set({ balanceCents: sql`${users.balanceCents} + ${refundCents}` })
            .where(eq(users.id, userId));
        }
      }

      return { ok: true as const, billedSeconds, realCents };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Falha ao reconciliar sessão.",
      };
    }
  });
