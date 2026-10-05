import { z } from "zod";

export const GOALS = [
  "Emagrecimento",
  "Definição",
  "Glúteos",
  "Hipertrofia",
  "Força",
  "Postura e movimento",
  "Bem-estar",
] as const;
export const assessmentSchema = z.object({
  professional: z.enum(["lz-team", "lee-ricardo"]),
  name: z.string().trim().min(2).max(100),
  goal: z.enum(GOALS),
  days: z.coerce.number().int().min(1).max(7),
  minutes: z.coerce.number().int().min(15).max(120),
  experience: z.enum(["Começando", "Retomando", "Já tenho uma rotina"]),
  location: z.enum(["Academia", "Em casa", "Ao ar livre"]),
  challenge: z.string().trim().max(600),
  limitations: z.string().trim().max(600),
  needsReview: z.boolean(),
  adult: z.literal(true),
  consent: z.literal(true),
});
export type Assessment = z.infer<typeof assessmentSchema>;
export function buildGuide(a: Assessment) {
  const review = a.needsReview || a.limitations.trim().length > 0;
  return {
    title: `${a.name}, seu próximo passo começa aqui.`,
    goal: a.goal,
    routine: `${a.days} dias por semana · ${a.minutes} minutos disponíveis · ${a.location}`,
    focus:
      a.goal === "Glúteos"
        ? "Converse com o profissional sobre progressão, técnica e recuperação para desenvolver glúteos."
        : a.goal === "Emagrecimento"
          ? "Organize uma rotina sustentável de movimento e acompanhamento nutricional, sem promessas de perda rápida de peso."
          : a.goal === "Hipertrofia" || a.goal === "Força"
            ? "Leve ao coach seu objetivo de progressão e a disponibilidade real para treinar e recuperar."
            : a.goal === "Postura e movimento"
              ? "Solicite uma avaliação de movimento antes de definir exercícios individuais."
              : "Construa consistência com metas possíveis e acompanhamento do profissional.",
    steps: [
      `Reserve ${a.days} momentos na agenda, respeitando os ${a.minutes} minutos que você informou.`,
      a.experience === "Começando"
        ? "Na primeira conversa, peça orientação sobre técnica e adaptação da rotina."
        : "Conte ao profissional o que já funcionou e o que dificultou sua continuidade.",
      a.challenge
        ? `Seu ponto de atenção: ${a.challenge}`
        : "Registre o que facilita e o que dificulta manter sua rotina.",
      "Faça um check-in semanal sobre sua experiência e discuta ajustes com o especialista.",
    ],
    review,
    next: review
      ? "Sua avaliação precisa de atenção individual. Aguarde a revisão do profissional antes de iniciar um novo treino."
      : "Seu guia está pronto. O próximo passo é revisar sua avaliação com o especialista e definir o acompanhamento.",
    scope:
      "Guia educativo personalizado a partir das suas respostas. Treinos e orientações nutricionais individuais são liberados pelo profissional responsável.",
  };
}
export const workoutSchema = z.object({
  title: z.string().trim().min(3).max(120),
  notes: z.string().trim().max(1200),
  exercises: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(120),
        sets: z.string().trim().min(1).max(50),
        reps: z.string().trim().min(1).max(50),
        guidance: z.string().trim().max(500),
      }),
    )
    .min(1)
    .max(30),
});
