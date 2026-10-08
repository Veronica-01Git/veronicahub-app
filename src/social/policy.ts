export const NETWORKS = ["youtube", "instagram", "tiktok", "facebook"] as const;
export type Network = (typeof NETWORKS)[number];
export const GOALS = ["usuarios", "cliques", "seguidores", "vendas"] as const;
export type Goal = (typeof GOALS)[number];
export type SourceInput = {
  url: string;
  title: string;
  transcript: string;
  goal: Goal;
  destination: string;
  priority: number;
  rightsConfirmed: boolean;
};
export function youtubeUrl(value: string) {
  const u = new URL(value.trim());
  if (u.protocol !== "https:" || u.username || u.password)
    throw new Error("Use um link HTTPS do YouTube.");
  let id: string | null = null;
  if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(u.hostname)) {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else id = /^\/(?:shorts|live)\/([\w-]{11})\/?$/.exec(u.pathname)?.[1] ?? null;
  } else if (u.hostname === "youtu.be") id = /^\/([\w-]{11})\/?$/.exec(u.pathname)?.[1] ?? null;
  if (!id || !/^[\w-]{11}$/.test(id))
    throw new Error("Informe o link de um vídeo, não de um canal ou playlist.");
  return { videoId: id, url: `https://www.youtube.com/watch?v=${id}` };
}
export function destinationUrl(value: string) {
  const u = new URL(value.trim(), "https://veronicahub.com");
  if (
    u.protocol !== "https:" ||
    u.hostname !== "veronicahub.com" ||
    u.port ||
    u.username ||
    u.password ||
    u.pathname.startsWith("/admin") ||
    u.pathname.startsWith("/api")
  )
    throw new Error("Escolha uma página pública da Veronica Hub.");
  u.search = "";
  u.hash = "";
  return u.toString();
}
function plain(value: unknown, max: number, label: string) {
  if (typeof value !== "string" || value.length > max || /[<>\x00-\x08]/.test(value))
    throw new Error(`${label} inválido.`);
  return value.trim();
}
export function sourceInput(input: unknown): SourceInput & { videoId: string } {
  const v = input as Partial<SourceInput>;
  if (!v || typeof v.url !== "string") throw new Error("Link inválido.");
  const video = youtubeUrl(v.url);
  const title = plain(v.title, 160, "Título");
  if (!title) throw new Error("Dê um título para organizar a fila.");
  if (!GOALS.includes(v.goal as Goal)) throw new Error("Objetivo inválido.");
  if (!Number.isInteger(v.priority) || v.priority! < 0 || v.priority! > 10)
    throw new Error("Prioridade: 0 a 10.");
  if (typeof v.rightsConfirmed !== "boolean") throw new Error("Confirme a autorização de uso.");
  return {
    ...video,
    title,
    transcript: plain(v.transcript ?? "", 14000, "Transcrição"),
    goal: v.goal as Goal,
    destination: destinationUrl(v.destination ?? "/"),
    priority: v.priority!,
    rightsConfirmed: v.rightsConfirmed,
  };
}
export type Creative = {
  hook: string;
  coverTitle: string;
  caption: string;
  editNotes: string;
  hashtags: string[];
};
export function validateCreative(input: unknown): Creative {
  const v = input as Creative;
  if (
    !v ||
    Object.keys(v).sort().join() !==
      ["hook", "coverTitle", "caption", "editNotes", "hashtags"].sort().join()
  )
    throw new Error("INVALID_CREATIVE");
  const result = {
    hook: plain(v.hook, 180, "Gancho"),
    coverTitle: plain(v.coverTitle, 70, "Capa"),
    caption: plain(v.caption, 1000, "Legenda"),
    editNotes: plain(v.editNotes, 1000, "Edição"),
    hashtags: v.hashtags,
  };
  if (
    !Array.isArray(v.hashtags) ||
    v.hashtags.length > 5 ||
    !v.hashtags.every((x) => /^#[\p{L}\p{N}_]{2,40}$/u.test(x))
  )
    throw new Error("INVALID_HASHTAGS");
  if (
    Object.values(result).some(
      (v) =>
        typeof v === "string" &&
        (!v || /https?:\/\/|@|garantid[oa]|viral garantido|ignore.*instru/i.test(v)),
    )
  )
    throw new Error("INVALID_CREATIVE");
  return result;
}
export function networkKit(id: string, goal: Goal, creative: Creative) {
  const questions: Record<Goal, string> = {
    usuarios: "Qual tarefa você gostaria de resolver com IA? Conheça a Veronica Hub.",
    cliques: "Quer explorar isso na prática? Veja os recursos da Veronica Hub.",
    seguidores: "Que assunto você quer ver no próximo vídeo? Siga para acompanhar.",
    vendas:
      "Faz sentido para o seu projeto? Conheça as soluções e confira as condições na Veronica Hub.",
  };
  return NETWORKS.map((network) => ({
    network,
    title: creative.coverTitle,
    caption: `${creative.caption}\n\n${questions[goal]} ${network === "instagram" || network === "tiktok" ? "Acesse pelo link da bio." : "Explore pelo link abaixo."}\n\n${creative.hashtags.join(" ")}`,
    trackedUrl: `https://veronicahub.com/api/social/go/${id}/${network}`,
    hook: creative.hook,
    coverTitle: creative.coverTitle,
    editNotes: creative.editNotes,
  }));
}
export function escapeXml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!,
  );
}
export function coverSvg(title: string) {
  const words = title.slice(0, 70).split(/\s+/);
  const lines: string[] = [""];
  for (const word of words) {
    if ((lines[lines.length - 1] + word).length > 16) lines.push("");
    lines[lines.length - 1] += `${word} `;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="#f4f4f2"/><rect x="80" y="440" width="920" height="8" fill="#ef4444"/><text x="80" y="400" font-family="Arial,sans-serif" font-size="36" letter-spacing="4" fill="#52525b">VERONICA HUB · YO LAB &amp; CO.</text>${lines
    .slice(0, 6)
    .map(
      (line, i) =>
        `<text x="80" y="${680 + i * 112}" font-family="Arial,sans-serif" font-size="88" font-weight="700" fill="#18181b">${escapeXml(line.trim())}</text>`,
    )
    .join(
      "",
    )}<text x="80" y="1430" font-family="Arial,sans-serif" font-size="38" fill="#52525b">Ideias que viram possibilidades.</text><text x="80" y="1500" font-family="Arial,sans-serif" font-size="34" fill="#52525b">veronicahub.com</text></svg>`;
}
