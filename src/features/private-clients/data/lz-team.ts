import type { WorkspaceContent } from "./types";

// Nenhum dado de LZ Team existe no projeto até agora. Tudo aqui é estado
// honesto de "ainda não configurado" — nada de métricas inventadas.
export const lzTeamWorkspace: WorkspaceContent = {
  operationStatus: {
    label: "Aguardando selo",
    tone: "muted",
    detail:
      "Ambiente reservado. O acesso é liberado assim que um número de série do selo for emitido para o LZ Team.",
  },
  mission: {
    title: "Definir escopo e primeiro entregável",
    body:
      "Ainda não há objetivo, backlog ou integração registrados no sistema para este cliente. As informações entram aqui conforme forem definidas com o time.",
  },
  nextActions: [
    { label: "01", detail: "Reunião de escopo e definição do objetivo", state: "current" },
    { label: "02", detail: "Emissão do selo de procedência do projeto", state: "next" },
    { label: "03", detail: "Cadastro de ativos e documentos do time", state: "next" },
    { label: "04", detail: "Integração de dados — não configurada", state: "blocked" },
  ],
  activity: [{ when: "—", text: "Nenhuma atividade registrada até o momento." }],
};
