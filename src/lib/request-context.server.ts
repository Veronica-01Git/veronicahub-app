/**
 * Acesso à Request corrente de dentro de um server function.
 *
 * Mora fora de `security.ts` de propósito: aquele módulo é puro e sem
 * dependência (os testes o importam direto no node), e este puxa o runtime da
 * TanStack Start.
 */
import { getRequest } from "@tanstack/react-start/server";
import { clientIp } from "./security";

/**
 * IP de quem chamou o server function, ou "desconhecido" quando o runtime não
 * expõe a Request. Nunca lança: uma camada anti-abuso não pode ser o motivo de
 * uma rota cair.
 */
export function clientIpFromContext(): string {
  try {
    const request = getRequest();
    return request ? clientIp(request) : "desconhecido";
  } catch {
    return "desconhecido";
  }
}
