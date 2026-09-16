import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { users, walletTopUps, ledgerEntries } from "./schema";
import {
  getPaymentClient,
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from "./mercadopago";
import { checkMemoryRateLimit, clientIp } from "./security";

type MpWebhookBody = {
  type?: string;
  action?: string;
  data?: { id?: string | number };
};

// Chamado direto do src/server.ts (interceptado antes do handler do
// TanStack) — precisa de URL fixa/previsível pra registrar no painel do
// Mercado Pago, o que a URL de RPC com hash do createServerFn não permite.
export async function handleMercadoPagoWebhook(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // O Mercado Pago manda esse evento de duas formas: a assinatura de
  // Webhooks (painel) manda `type` + `data.id` no corpo JSON; a
  // `notification_url` da Preference manda formato legado (IPN) via query
  // string (`topic`/`id`, corpo vazio). Aceita os dois — mesmo padrão do
  // negocio-da-china-app.
  let bodyJson: MpWebhookBody | null = null;
  try {
    bodyJson = (await request.clone().json()) as MpWebhookBody;
  } catch {
    // corpo vazio/não-JSON — ok, é o caminho legado via query string
  }

  const type = bodyJson?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId =
    (bodyJson?.data?.id != null ? String(bodyJson.data.id) : null) ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("id");

  if (type !== "payment" || !dataId) {
    return Response.json({ received: true });
  }

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("MERCADOPAGO_WEBHOOK_SECRET não configurada — recusando webhook");
    return Response.json({ error: "Webhook não configurado" }, { status: 500 });
  }

  const xSignature = request.headers.get("x-signature");
  if (xSignature) {
    try {
      WebhookSignatureValidator.validate({
        xSignature,
        xRequestId: request.headers.get("x-request-id"),
        dataId,
        secret,
      });
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        console.error("Webhook MP com assinatura inválida:", err.reason, err.requestId);
        return Response.json({ error: "Assinatura inválida" }, { status: 401 });
      }
      console.error("Erro inesperado validando assinatura do webhook:", err);
      return Response.json({ error: "Assinatura inválida" }, { status: 401 });
    }
  } else if (process.env.MERCADOPAGO_REQUIRE_SIGNATURE === "true") {
    // Modo estrito: sem assinatura, não passa.
    console.error("Webhook MP sem x-signature recusado (modo estrito) — data.id:", dataId);
    return Response.json({ error: "Assinatura ausente" }, { status: 401 });
  } else {
    // Sem x-signature (formato legado/IPN). O que segura este caminho não é
    // confiança no payload: é que o valor creditado sai da NOSSA linha em
    // walletTopUps e a aprovação sai da API do MP logo abaixo — forjar o
    // corpo não inventa um pagamento aprovado nem muda o valor.
    //
    // O que sobra é uso como amplificador: qualquer pessoa na internet podia
    // fazer o Worker chamar a API do MP em loop. Daí o limite por IP.
    //
    // Recusar de cara seria mais limpo, mas se alguma notificação legítima
    // ainda chegar sem assinatura o efeito é pagamento recebido e crédito não
    // lançado — pior que o risco acima. Por isso é opt-in:
    // MERCADOPAGO_REQUIRE_SIGNATURE=true liga o modo estrito depois que o log
    // confirmar que 100% das notificações da conta chegam assinadas.
    console.warn("Webhook MP sem x-signature (formato legado/IPN) — data.id:", dataId);

    const limite = checkMemoryRateLimit(
      `mp-webhook-sem-assinatura:${clientIp(request)}`,
      20,
      60_000,
    );
    if (!limite.ok) {
      return Response.json({ error: "Muitas notificações" }, { status: 429 });
    }
  }

  const payment = await getPaymentClient().get({ id: dataId });
  const topUpId = payment.external_reference;
  if (!topUpId) {
    return Response.json({ received: true });
  }

  const db = getDb();

  if (payment.status === "approved") {
    // Só credita se essa transição PENDENTE -> PAGO afetar exatamente 1
    // linha — replay do mesmo evento vira no-op. Fonte da verdade da
    // idempotência é essa condição no WHERE, não uma trava separada.
    const [updated] = await db
      .update(walletTopUps)
      .set({ status: "PAGO", gatewayPaymentId: String(payment.id), paidAt: new Date() })
      .where(and(eq(walletTopUps.id, topUpId), eq(walletTopUps.status, "PENDENTE")))
      .returning();

    if (updated) {
      await db.batch([
        db
          .update(users)
          .set({ balanceCents: sql`${users.balanceCents} + ${updated.amountCents}` })
          .where(eq(users.id, updated.userId)),
        db.insert(ledgerEntries).values({
          userId: updated.userId,
          deltaCents: updated.amountCents,
          reason: `topup:${updated.id}`,
        }),
      ]);
    }
  } else if (payment.status === "rejected" || payment.status === "cancelled") {
    await db
      .update(walletTopUps)
      .set({ status: "CANCELADO" })
      .where(and(eq(walletTopUps.id, topUpId), eq(walletTopUps.status, "PENDENTE")));
  }

  return Response.json({ received: true });
}
