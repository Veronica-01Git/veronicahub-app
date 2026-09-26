import { createServerFn } from "@tanstack/react-start";

import type { LzImageSlot, LzUtm } from "./content";

export type LzImageMap = Partial<Record<LzImageSlot, { url: string; alt: string | null }>>;

/**
 * Fotos da página pública, lidas da tabela MediaImage pelo prefixo de nome
 * `lz-team--`. Pública como o próprio /api/media-images/:id: devolve só id e
 * texto alternativo, nunca a coluna `data`. Se o mesmo slot tiver mais de um
 * upload, vale o mais recente — trocar foto é só subir de novo.
 */
export const getLzTeamImages = createServerFn({ method: "GET" }).handler(
  async (): Promise<LzImageMap> => {
    const [
      { getDb },
      { mediaImages },
      { desc, like },
      { LZ_IMAGE_FILENAME_PREFIX, slotFromFilename },
    ] = await Promise.all([
      import("@/lib/db"),
      import("@/lib/schema"),
      import("drizzle-orm"),
      import("./content"),
    ]);

    try {
      const rows = await getDb()
        .select({
          id: mediaImages.id,
          filename: mediaImages.filename,
          altText: mediaImages.altText,
        })
        .from(mediaImages)
        .where(like(mediaImages.filename, `${LZ_IMAGE_FILENAME_PREFIX}%`))
        .orderBy(desc(mediaImages.createdAt))
        .limit(50);

      const images: LzImageMap = {};
      for (const row of rows) {
        const slot = slotFromFilename(row.filename);
        if (slot && !images[slot]) {
          images[slot] = { url: `/api/media-images/${row.id}`, alt: row.altText };
        }
      }
      return images;
    } catch (error) {
      // Banco fora do ar não derruba a página de vendas: os slots só ficam
      // marcados como pendentes e o WhatsApp continua funcionando.
      console.error("lz-team: falha ao ler MediaImage", error);
      return {};
    }
  },
);

export type LzApplicationResult =
  | { ok: true }
  | { ok: false; error: string; fallbackToWhatsapp: boolean };

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";

/**
 * "Aplicar para acompanhamento": avisa a equipe por e-mail (Resend, mesmo
 * padrão de src/lib/auth-server.ts). Destinatários em LZ_TEAM_LEADS_TO,
 * variável do servidor — sem ela, nada é enviado e a página manda o visitante
 * para o WhatsApp, que é o canal que já funciona hoje.
 */
export const submitLzTeamApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const data = (input ?? {}) as Record<string, unknown>;
    const utmIn = (data.utm ?? {}) as Record<string, unknown>;
    const utm: LzUtm = {};
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ] as const) {
      const value = clean(utmIn[key], 120);
      if (value) utm[key] = value;
    }
    return {
      name: clean(data.name, 120),
      whatsapp: clean(data.whatsapp, 32),
      goal: clean(data.goal, 40),
      message: typeof data.message === "string" ? data.message.trim().slice(0, 1500) : "",
      // Campo invisível: gente não preenche, robô preenche.
      website: clean(data.website, 200),
      utm,
    };
  })
  .handler(async ({ data }): Promise<LzApplicationResult> => {
    if (data.website) return { ok: true };

    if (data.name.length < 2) {
      return { ok: false, error: "Informe seu nome.", fallbackToWhatsapp: false };
    }
    const digits = data.whatsapp.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) {
      return {
        ok: false,
        error: "Informe um WhatsApp com DDD (ex.: 47 99999-9999).",
        fallbackToWhatsapp: false,
      };
    }

    const { parseAllowedEmails } = await import("@/features/private-clients/access-policy");
    const recipients = parseAllowedEmails(process.env.LZ_TEAM_LEADS_TO);
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from || recipients.length === 0) {
      console.error("lz-team: RESEND_API_KEY/EMAIL_FROM/LZ_TEAM_LEADS_TO não configurados");
      return {
        ok: false,
        error: "O envio por formulário ainda não está ativo. Fale direto pelo WhatsApp.",
        fallbackToWhatsapp: true,
      };
    }

    const utmLines = Object.entries(data.utm).map(([key, value]) => `${key}: ${value}`);
    const text = [
      "Nova aplicação para acompanhamento — LZ Training Club",
      "",
      `Nome: ${data.name}`,
      `WhatsApp: ${data.whatsapp} (https://wa.me/${digits.length <= 11 ? `55${digits}` : digits})`,
      `Objetivo: ${data.goal || "não informado"}`,
      "",
      "Mensagem:",
      data.message || "(sem mensagem)",
      "",
      "Origem da campanha:",
      ...(utmLines.length ? utmLines : ["(acesso direto, sem UTM)"]),
      "",
      "Enviado pela página veronicahub.com/clientes/lz-team",
    ].join("\n");

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: recipients,
          subject: `Aplicação LZ Training Club — ${data.name}`,
          text,
        }),
      });
      if (!response.ok) {
        console.error("lz-team: Resend recusou", response.status, await response.text());
        return {
          ok: false,
          error: "Não foi possível enviar agora. Fale direto pelo WhatsApp.",
          fallbackToWhatsapp: true,
        };
      }
    } catch (error) {
      console.error("lz-team: falha ao chamar Resend", error);
      return {
        ok: false,
        error: "Não foi possível enviar agora. Fale direto pelo WhatsApp.",
        fallbackToWhatsapp: true,
      };
    }

    return { ok: true };
  });
