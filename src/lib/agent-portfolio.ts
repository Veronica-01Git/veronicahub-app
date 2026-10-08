import { product } from "./ecosystem.ts";
import { rotaDoAgente, type AgenteWorkforce } from "./ai-workforce.ts";
/** Links derivados da rota canônica; provas extras têm endpoints implementados. */
export function routesForAgent(a: AgenteWorkforce) {
  const main = rotaDoAgente(a);
  const routes = [{ href: main.to, label: main.name }];
  if (a.id === "comercial")
    routes.push({ href: "/api/agents/commercial/status", label: "Evidência pública" });
  if (a.id === "redacao")
    routes.push({ href: "/api/wire/feed.json", label: "Feed de publicações" });
  if (a.id === "analytics")
    routes.push({ href: "/api/agents/analytics/status", label: "Histórico público" });
  if (a.id === "members")
    routes.push({ href: "/api/agents/members/status", label: "Histórico público" });
  if (a.id === "social-shorts")
    routes.push({ href: "/api/agents/social-shorts/status", label: "Estado da operação" });
  if (a.id === "lz-fitness") {
    routes.push({ href: "/agentes-humanos", label: "Verônica · Agentes Humanos" });
    routes.push({ href: "/clientes/lz-team", label: "LZ Training Club · Lucas Tomaz" });
  }
  if (a.id === "carreira") routes.push({ href: product("rh").to, label: product("rh").name });
  if (a.painel && a.painel.to !== main.to)
    routes.push({
      href: a.painel.to,
      label: `${a.painel.rotulo}${a.painel.acesso === "interno" ? " · acesso restrito" : ""}`,
    });
  return routes;
}
