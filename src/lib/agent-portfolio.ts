import { rotaDoAgente, type AgenteWorkforce } from "./ai-workforce.ts";
/** Links derivados da rota canônica; provas extras têm endpoints implementados. */
export function routesForAgent(a: AgenteWorkforce) {
  const main = rotaDoAgente(a);
  const routes = [{ href: main.to, label: main.name }];
  if (a.id === "redacao")
    routes.push({ href: "/api/wire/feed.json", label: "Feed de publicações" });
  if (a.id === "members")
    routes.push({ href: "/api/agents/members/status", label: "Histórico público" });
  return routes;
}
