import { createFileRoute } from "@tanstack/react-router";
import { VeronicaPharmaPage } from "@/features/pharma/page";

const TITLE = "Veronica Pharma · Abastecimento inteligente para redes de farmácia | Veronica Hub";
const DESCRIPTION =
  "Compras, estoque e validade de todas as filiais numa só operação. O agente Veronica Supply antecipa a ruptura, transfere entre filiais antes de comprar e prepara cada pedido para aprovação.";
const URL = "https://veronicahub.com/veronica-pharma";

export const Route = createFileRoute("/veronica-pharma")({
  component: VeronicaPharmaPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { property: "og:title", content: "Veronica Pharma · Sua rede abastecida" },
      { property: "og:description", content: DESCRIPTION },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Veronica Pharma · Sua rede abastecida" },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
});
