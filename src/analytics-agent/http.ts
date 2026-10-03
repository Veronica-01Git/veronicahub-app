export function authorizeAnalyticsRequest(request: Request, secret: string | undefined) {
  const path = new URL(request.url).pathname;
  if (path === "/api/agents/analytics/status") return request.method === "GET" ? "status" : 405;
  if (path !== "/api/cron/analytics-agent") return 404;
  if (request.method !== "POST") return 405;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return 401;
  return "run";
}
