import {
  ANALYTICS_AGENT,
  fallbackCreative,
  validateCreative,
  type AgentOffer,
  type Briefing,
} from "./policy.ts";
import { checkTenantAccess } from "../lib/ai/tenant-guard.ts";
import { HOUSE_TENANT } from "../lib/ai/platform-types.ts";
export type AgentTools = {
  catalog: () => Promise<AgentOffer[]>;
  houseClicks: () => Promise<{ productId: string; clicks: number }[]>;
  validLink: (url: string) => boolean;
  creative?: () => Promise<unknown>;
  publish: (result: AgentResult) => Promise<void>;
};
export type AgentResult = {
  checked: number;
  rejectedLinks: number;
  missingImages: number;
  briefings: Briefing[];
  modelAttempted: boolean;
  modelAccepted: boolean;
  modelIssue: boolean;
};
/** No user-supplied prompt, tenant, tool name or affiliate code can reach the executor. */
export async function executeAnalyticsAgent(
  tenant: string,
  tools: AgentTools,
): Promise<AgentResult> {
  if (!checkTenantAccess({ slug: ANALYTICS_AGENT.slug, allowedTenants: [HOUSE_TENANT] }, tenant).ok)
    throw new Error("TENANT_FORBIDDEN");
  const [offers, interest] = await Promise.all([tools.catalog(), tools.houseClicks()]);
  if (offers.length > 100) throw new Error("CATALOG_LIMIT");
  const counts = new Map(interest.map((r) => [r.productId, Math.max(0, Number(r.clicks) || 0)]));
  const eligible = offers.filter((o) => tools.validLink(o.affiliateUrl));
  // Interest is measured house forwarding, not demand, conversion or commission.
  const ranked = eligible
    .map((o) => ({
      offer: o,
      clicks: counts.get(o.id) ?? 0,
      complete: Number(!!o.coverUrl) + Number(!!o.priceLabel),
    }))
    .sort(
      (a, b) =>
        b.clicks - a.clicks || b.complete - a.complete || a.offer.id.localeCompare(b.offer.id),
    );
  let creative = fallbackCreative(),
    modelAccepted = false,
    modelIssue = false;
  if (tools.creative && ranked.length) {
    try {
      creative = validateCreative(await tools.creative());
      modelAccepted = true;
    } catch {
      modelIssue = true;
    }
  }
  const result: AgentResult = {
    checked: offers.length,
    rejectedLinks: offers.length - eligible.length,
    missingImages: eligible.filter((o) => !o.coverUrl).length,
    modelAttempted: !!tools.creative && !!ranked.length,
    modelAccepted,
    modelIssue,
    briefings: ranked.slice(0, 3).map(({ offer, clicks }) => ({
      productId: offer.id,
      reason:
        clicks > 0
          ? "Interesse registrado nos links da Hub; não comprova vendas."
          : "Escolha pela completude do cadastro; ainda sem interesse registrado nos links da Hub.",
      ...creative,
      mode: modelAccepted ? "model" : "rules",
    })),
  };
  await tools.publish(result);
  return result;
}
