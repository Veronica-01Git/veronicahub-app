/** Browser-only Portfolio tools. No account, storage, provider or network access. */
export type PortfolioBrief = { name: string; profession: string };

export type PortfolioTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => Promise<string>;
};

export type PortfolioModelContext = {
  registerTool: (
    tool: PortfolioTool,
    options: { signal: AbortSignal },
  ) => unknown;
};

export function createPortfolioTools(
  professions: readonly string[],
  proposeBrief: (brief: PortfolioBrief) => void,
): PortfolioTool[] {
  return [
    {
      name: "veronica_portfolio_describe",
      description:
        "Describe the Veronica Portfolio local demo and its supported professions. Does not read personal information or existing form inputs.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async () =>
        JSON.stringify({
          mode: "local_demo",
          professions,
          canPrepareBrief: true,
          canGenerateViaTool: false,
          persistsData: false,
          nextStep:
            "Prepare a brief with the user's name and one supported profession. The user reviews and applies it on the page before generating a local simulation.",
        }),
    },
    {
      name: "veronica_portfolio_prepare_brief",
      description:
        "Propose a name and profession supplied by the user for a local portfolio simulation. Creates a visible suggestion for review; does not overwrite form fields, generate, publish or save a portfolio. A second proposal replaces the pending suggestion only.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 80,
            description: "Name explicitly provided by the user.",
          },
          profession: { type: "string", enum: [...professions] },
        },
        required: ["name", "profession"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input) => {
        if (!input || typeof input !== "object" || Array.isArray(input)) {
          throw new Error("Informe nome e profissão em um objeto.");
        }
        const value = input as Record<string, unknown>;
        if (
          Object.keys(value).some(
            (key) => key !== "name" && key !== "profession",
          )
        ) {
          throw new Error("Este briefing aceita apenas nome e profissão.");
        }
        if (
          typeof value.name !== "string" ||
          !value.name.trim() ||
          value.name.length > 80 ||
          /[\u0000-\u001f\u007f]/.test(value.name)
        ) {
          throw new Error(
            "Informe um nome de 1 a 80 caracteres, sem caracteres de controle.",
          );
        }
        if (
          typeof value.profession !== "string" ||
          !professions.includes(value.profession)
        ) {
          throw new Error(
            "Escolha uma profissão retornada por veronica_portfolio_describe.",
          );
        }
        proposeBrief({ name: value.name.trim(), profession: value.profession });
        return JSON.stringify({
          status: "awaiting_user_review",
          generated: false,
          saved: false,
        });
      },
    },
  ];
}

/** AbortSignal removes only these registrations when the route unmounts. */
export function registerPortfolioTools(
  context: PortfolioModelContext,
  tools: PortfolioTool[],
): () => void {
  const controller = new AbortController();
  for (const tool of tools) {
    if (controller.signal.aborted) break;
    try {
      const registration = context.registerTool(
        {
          ...tool,
          execute: async (input) => {
            if (controller.signal.aborted)
              throw new Error("A página do Portfolio foi fechada.");
            return tool.execute(input);
          },
        },
        { signal: controller.signal },
      );
      // This is an optional browser enhancement. A rejected registration must
      // neither break the form nor leave a partially registered tool set.
      void Promise.resolve(registration).catch(() => controller.abort());
    } catch {
      controller.abort();
    }
  }
  return () => controller.abort();
}
