/**
 * Server functions do V-IVA — só para admin.
 *
 * Mesmo padrão de wire-commerce-server.ts: `requireAdmin` primeiro, e quem
 * não é admin recebe `{ ok: false }`. O núcleo (./evaluation.server.ts) entra
 * por import dinâmico, para a agente e os SDKs de modelo nunca irem para o
 * pacote do navegador.
 *
 * Server function é endpoint público: estar atrás de uma tela de admin não
 * protege nada. Por isso cada função confere o acesso de novo — e a que
 * gasta modelo (`rodarAvaliacaoReal`) só roda com confirmação explícita do
 * teto de custo mostrado antes.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "../admin-server";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validarSlug(data: unknown): { slug: string } {
  const slug =
    typeof (data as { slug?: unknown })?.slug === "string" ? (data as { slug: string }).slug : "";
  if (!SLUG.test(slug)) throw new Error("slug inválido");
  return { slug };
}

export const resumoDoVIVA = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Acesso restrito." };
  const { AGENT_REGISTRY } = await import("./agent-registry");
  const { avaliarEspecificacao, estimarAvaliacao } = await import("./evaluation.server");
  const agentes = await Promise.all(
    AGENT_REGISTRY.map(async (a) => ({
      slug: a.slug,
      status: a.status,
      estimativa: estimarAvaliacao(a.slug),
      especificacao: await avaliarEspecificacao(a.slug),
    })),
  );
  return { ok: true as const, agentes };
});

export const rodarAvaliacaoReal = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { slug } = validarSlug(data);
    const confirmado = (data as { confirmoCustoMaximoMicros?: unknown }).confirmoCustoMaximoMicros;
    return { slug, confirmoCustoMaximoMicros: typeof confirmado === "number" ? confirmado : -1 };
  })
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) return { ok: false as const, error: "Acesso restrito." };
    const { estimarAvaliacao, rodarAvaliacaoComExecutor } = await import("./evaluation.server");
    const estimativa = estimarAvaliacao(data.slug);
    if (!estimativa?.executor) {
      return { ok: false as const, error: "Este agente ainda não tem executor real ligado." };
    }
    // O teto confirmado na tela precisa ser o mesmo que o servidor calcula agora.
    if (estimativa.custoMaximoMicros !== data.confirmoCustoMaximoMicros) {
      return { ok: false as const, error: "O teto de custo mudou. Recarregue e confirme de novo." };
    }
    return rodarAvaliacaoComExecutor(data.slug, `admin:${admin.id}`);
  });
