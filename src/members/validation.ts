import { z } from "zod";
export const mediaUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => {
    if (!v) return true;
    if (/^\/[^/\\]/.test(v) && !v.includes("\\")) return true;
    try {
      const u = new URL(v);
      return u.protocol === "https:" && !u.username && !u.password;
    } catch {
      return false;
    }
  }, "Use uma URL HTTPS ou um caminho do site.");
export const postInput = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(3).max(160),
    body: z.string().trim().min(10).max(30000),
    kind: z.enum(["novidade", "prompt", "ideia", "imagem", "video"]),
    prompt: z.string().trim().max(16000).default(""),
    mediaUrl: mediaUrlSchema.default(""),
    status: z.enum(["draft", "published"]),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "prompt" && !v.prompt)
      ctx.addIssue({ code: "custom", path: ["prompt"], message: "Inclua o prompt." });
    if (["imagem", "video"].includes(v.kind) && !v.mediaUrl)
      ctx.addIssue({ code: "custom", path: ["mediaUrl"], message: "Inclua a mídia." });
  });
export const commentInput = z.object({
  postId: z.string().uuid(),
  name: z.string().trim().min(2).max(60),
  body: z.string().trim().min(2).max(2000),
});
