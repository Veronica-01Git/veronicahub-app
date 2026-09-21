import { findSeal } from "@/lib/seals";
import type { WorkspaceContent } from "./types";

const seal = findSeal("VH-AUT-WA-2026-000001");

export const expressWorkspace: WorkspaceContent = {
  operationStatus: {
    label: seal?.statusLabel ?? "Em desenvolvimento",
    tone: "cyan",
    detail:
      "Ambiente de acompanhamento. Nenhuma mensagem é enviada ou respondida a partir daqui — o WhatsApp da empresa segue exclusivamente no aparelho e no número atual.",
  },
  mission: {
    title: "Colocar o agente de atendimento em operação real",
    body:
      seal?.summary ??
      "Registro de procedência do agente operacional de WhatsApp da Express Entulho.",
  },
  nextActions: (seal?.timeline ?? []).map((event) => ({
    label: event.date,
    detail: event.label,
    state: event.state,
  })),
  activity: [
    { when: "Registro", text: `Selo ${seal?.serial ?? "—"} emitido em ${seal?.issuedAt ?? "—"}.` },
    { when: "Escopo", text: (seal?.scope ?? []).join(" · ") },
    { when: "Suporte", text: seal?.support ?? "A combinar" },
  ],
};
