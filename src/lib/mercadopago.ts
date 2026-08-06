import {
  MercadoPagoConfig,
  Preference,
  Payment,
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from "mercadopago";

// Mesma conta/credenciais de produção do negocio-da-china-app (mesmo
// dinheiro, mesma conta MP) — contas de usuário continuam separadas entre
// os dois apps. Singleton lazy, só usado em código server-only.
let mpConfig: MercadoPagoConfig | undefined;

function getMpConfig(): MercadoPagoConfig {
  if (!mpConfig) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurada");
    }
    mpConfig = new MercadoPagoConfig({ accessToken });
  }
  return mpConfig;
}

export function getPreferenceClient(): Preference {
  return new Preference(getMpConfig());
}

export function getPaymentClient(): Payment {
  return new Payment(getMpConfig());
}

export { WebhookSignatureValidator, InvalidWebhookSignatureError };

export function centsToReais(cents: number): number {
  return cents / 100;
}

// Depósito genérico de saldo (top-up), não um item de marketplace — igual
// pra qualquer valor que o usuário escolher, usado por Studio e
// Currículo-Certo/RH via a mesma carteira.
export async function createTopUpPreference(params: {
  topUpId: string;
  amountCents: number;
  payerEmail?: string;
  webhookBaseUrl: string;
}): Promise<{ checkoutUrl: string }> {
  const { topUpId, amountCents, payerEmail, webhookBaseUrl } = params;

  const preference = await getPreferenceClient().create({
    body: {
      items: [
        {
          id: "wallet-topup",
          title: "Créditos Veronica Hub",
          quantity: 1,
          currency_id: "BRL",
          unit_price: centsToReais(amountCents),
        },
      ],
      payer:
        process.env.NODE_ENV === "production" && payerEmail ? { email: payerEmail } : undefined,
      external_reference: topUpId,
      notification_url: `${webhookBaseUrl}/api/mercadopago-webhook`,
      back_urls: {
        success: `${webhookBaseUrl}/video-ia?topup=${topUpId}`,
        pending: `${webhookBaseUrl}/video-ia?topup=${topUpId}&status=pendente`,
        failure: `${webhookBaseUrl}/video-ia?topup=${topUpId}&status=erro`,
      },
      auto_return: "approved",
    },
  });

  const checkoutUrl =
    process.env.NODE_ENV === "production"
      ? preference.init_point
      : (preference.sandbox_init_point ?? preference.init_point);

  if (!checkoutUrl) {
    throw new Error("Mercado Pago não retornou uma URL de checkout");
  }

  return { checkoutUrl };
}
