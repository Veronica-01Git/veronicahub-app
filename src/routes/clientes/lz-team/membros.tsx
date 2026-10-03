import { createFileRoute } from "@tanstack/react-router";
import { LzPlatform } from "@/features/lz-team/platform-ui";

export const Route = createFileRoute("/clientes/lz-team/membros")({
  component: () => <LzPlatform section="membros" />,
  head: () => ({ meta: [
    { title: "Membros · LZ Training Club" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
});
