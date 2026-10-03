/** A direct Hub sale has no distributor share. Values are reported commissions. */
export const HOUSE_REVENUE_CODE = "veronica";
export function allocateAffiliateRevenue(
  commissionCents: number,
  affiliateCode: string,
  affiliatePct: number,
) {
  if (
    !Number.isSafeInteger(commissionCents) ||
    commissionCents < 0 ||
    commissionCents > 2_147_483_647
  )
    throw new Error("Comissão inválida.");
  if (!Number.isFinite(affiliatePct) || affiliatePct < 0 || affiliatePct > 100)
    throw new Error("Participação inválida.");
  const affiliateCents =
    affiliateCode === HOUSE_REVENUE_CODE ? 0 : Math.floor((commissionCents * affiliatePct) / 100);
  return { affiliateCents, houseCents: commissionCents - affiliateCents };
}
