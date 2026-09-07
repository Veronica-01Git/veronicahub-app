import { createServerFn } from "@tanstack/react-start";

const askUniverseValidator = (input: unknown) => {
  const data = input as { question?: unknown };
  if (typeof data?.question !== "string") {
    throw new Error("Pergunta inválida.");
  }
  return { question: data.question };
};

export const askVeronicaUniverse = createServerFn({ method: "POST" })
  .validator(askUniverseValidator)
  .handler(async ({ data }) => {
    const { askUniverseCore } = await import("./universe-intelligence.server");
    return askUniverseCore(data.question);
  });
