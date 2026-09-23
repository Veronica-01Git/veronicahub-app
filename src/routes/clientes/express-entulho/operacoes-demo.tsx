/**
 * Compatibilidade com o endereço da primeira demonstração.
 *
 * A Express Operations passou a ter uma única central canônica em
 * `/clientes/express-entulho/operacoes`. Mantemos este endereço apenas para
 * não quebrar favoritos e links já enviados ao cliente.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/clientes/express-entulho/operacoes-demo")({
  beforeLoad: () => {
    throw redirect({ to: "/clientes/express-entulho/operacoes", replace: true });
  },
});
