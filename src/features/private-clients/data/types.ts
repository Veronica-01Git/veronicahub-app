export type ActionItem = {
  label: string;
  detail: string;
  state: "done" | "current" | "next" | "blocked";
};

export type ActivityItem = { when: string; text: string; demo?: boolean };

export type WorkspaceContent = {
  operationStatus: { label: string; tone: "green" | "cyan" | "muted"; detail: string };
  mission: { title: string; body: string };
  nextActions: readonly ActionItem[];
  activity: readonly ActivityItem[];
};
