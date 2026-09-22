import type { WorkspaceContent } from "./types";

// Nenhum dado de LZ Team existe no projeto até agora. Tudo aqui é estado
// honesto de "ainda não configurado" — nada de métricas inventadas.
export const lzTeamWorkspace: WorkspaceContent = {
  operationStatus: {
    label: "Membro registrado",
    tone: "green",
    detail:
      "Selo de membro VH-MEM-2026-000002 emitido em 21/09/2026. Escopo e integrações ainda em definição.",
  },
  mission: {
    title: "Definir escopo e primeiro entregável",
    body:
      "Ainda não há objetivo, backlog ou integração registrados no sistema para este cliente. As informações entram aqui conforme forem definidas com o time.",
  },
  nextActions: [
    { label: "01", detail: "Reunião de escopo e definição do objetivo", state: "current" },
    { label: "02", detail: "Selo de membro emitido", state: "done" },
    { label: "03", detail: "Cadastro de ativos e documentos do time", state: "next" },
    { label: "04", detail: "Integração de dados — não configurada", state: "blocked" },
  ],
  activity: [{ when: "21/09/2026", text: "Selo de membro emitido · Cliente 02." }],
};
