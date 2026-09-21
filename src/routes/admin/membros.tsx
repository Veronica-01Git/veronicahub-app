import { createFileRoute } from "@tanstack/react-router";
import MemberAdmin from "@/members/MemberAdmin";
export const Route = createFileRoute("/admin/membros")({
  component: MemberAdmin,
  head: () => ({
    meta: [
      { title: "Editorial Members | Veronica Hub" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});
