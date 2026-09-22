/**
 * Redirect do endereço antigo.
 *
 * A central de operações morava em /preview/express-operations-b enquanto era
 * protótipo. Saiu de lá em 21/09 para /clientes/express-entulho/operacoes, e
 * este arquivo existe por um motivo só: o link antigo já foi mandado para o
 * cliente pelo WhatsApp. Link que o dono abriu uma vez e salvou não pode
 * quebrar na véspera da reunião.
 *
 * O `$` ao lado cobre as subrotas — /preview/express-operations-b/atendimento
 * e as outras cinco — porque o beforeLoad do layout roda antes de qualquer
 * filho e derruba a navegação aqui.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/preview/express-operations-b")({
  beforeLoad: () => {
    throw redirect({ to: "/clientes/express-entulho/operacoes", replace: true });
  },
});
