export type AffiliateSaleStatus = "pending" | "confirmed" | "cancelled";

export type AffiliateSaleImportRow = {
  externalOrderId: string;
  affiliateCode: string;
  productId: string | null;
  commissionCents: number;
  status: AffiliateSaleStatus;
  orderAt: Date | null;
};

function normalizeStatus(value: unknown): AffiliateSaleStatus {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (
    ["confirmado", "confirmed", "aprovado", "approved", "completo", "completed"].includes(
      normalized,
    )
  ) {
    return "confirmed";
  }
  if (
    ["cancelado", "cancelled", "canceled", "invalido", "invalid", "rejeitado"].includes(normalized)
  ) {
    return "cancelled";
  }
  return "pending";
}

function moneyToCents(value: unknown): number {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) throw new Error(`Comissão inválida: ${value}`);
    return Math.round(value * 100);
  }
  const cleaned = String(value ?? "")
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`Comissão inválida: ${value}`);
  return Math.round(amount * 100);
}

function validateRow(raw: unknown): AffiliateSaleImportRow {
  const row = raw as Record<string, unknown>;
  const externalOrderId = String(row.externalOrderId ?? row.orderId ?? row.pedido ?? "").trim();
  const affiliateCode = String(row.affiliateCode ?? row.subId ?? row.sub_id ?? "")
    .trim()
    .toLowerCase();
  const rawProductId = String(row.productId ?? row.produto ?? "").trim();
  const productId = rawProductId ? rawProductId.slice(0, 120) : null;
  const commissionCents =
    row.commissionCents !== undefined
      ? Math.max(0, Math.round(Number(row.commissionCents)))
      : moneyToCents(row.commission ?? row.comissao);
  const status = normalizeStatus(row.status);
  const rawDate = row.orderAt ?? row.orderDate ?? row.data;
  const parsedDate = rawDate ? new Date(String(rawDate)) : null;
  const orderAt = parsedDate && Number.isFinite(parsedDate.getTime()) ? parsedDate : null;

  if (!externalOrderId) throw new Error("Pedido sem identificador.");
  if (!affiliateCode) throw new Error(`${externalOrderId}: Sub_id ausente.`);
  if (!Number.isFinite(commissionCents)) throw new Error(`${externalOrderId}: comissão inválida.`);
  return {
    externalOrderId: externalOrderId.slice(0, 120),
    affiliateCode: affiliateCode.slice(0, 40),
    productId,
    commissionCents,
    status,
    orderAt,
  };
}

export function parseAffiliateSalesReport(raw: string): AffiliateSaleImportRow[] {
  if (!raw.trim()) throw new Error("Cole o relatório da Shopee.");
  if (raw.length > 2_000_000) throw new Error("O relatório excede o limite de 2 MB por lote.");

  let values: unknown[];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error();
    values = parsed;
  } catch {
    const lines = raw.split(/\r?\n/).filter((line) => line.trim());
    const delimiter = lines[0]?.includes("\t") ? "\t" : ";";
    values = lines
      .filter((_, index) => index > 0)
      .map((line) => {
        const [externalOrderId, affiliateCode, productId, commission, status, orderAt] =
          line.split(delimiter);
        return { externalOrderId, affiliateCode, productId, commission, status, orderAt };
      });
  }
  if (!values.length || values.length > 1000) {
    throw new Error("Envie entre 1 e 1.000 pedidos por lote.");
  }
  return values.map(validateRow);
}
