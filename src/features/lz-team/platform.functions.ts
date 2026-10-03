import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { users } from "@/lib/schema";
import { parseAllowedEmails } from "@/features/private-clients/access-policy";
import { fitnessAgentCases, fitnessLessons, fitnessPosts, fitnessStudents } from "./platform.schema";

const TENANT = "lz-team";
const emailOf = (value: unknown) => String(value ?? "").trim().toLowerCase().slice(0, 254);
const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";

async function identity() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const [user] = await getDb()
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ?? null;
}

async function membership() {
  const user = await identity();
  if (!user) return { role: "visitor" as const, userId: null, name: "" };
  // The public seal never grants access to real student data.
  const staff = parseAllowedEmails(process.env.LZ_TEAM_STAFF_EMAILS);
  if (staff.includes(user.email.toLowerCase())) {
    return { role: "coach" as const, userId: user.id, name: "Equipe LZ" };
  }
  // Safe rollout: while the staff allowlist is unset, the platform remains
  // closed without querying tables that may not have been migrated yet.
  if (!staff.length) return { role: "visitor" as const, userId: user.id, name: "" };
  const [student] = await getDb()
    .select({ fullName: fitnessStudents.fullName })
    .from(fitnessStudents)
    .where(and(
      eq(fitnessStudents.tenant, TENANT),
      eq(fitnessStudents.email, user.email.toLowerCase()),
      eq(fitnessStudents.status, "active"),
    ))
    .limit(1);
  return student
    ? { role: "student" as const, userId: user.id, name: student.fullName }
    : { role: "visitor" as const, userId: user.id, name: "" };
}

async function requireCoach() {
  const member = await membership();
  if (member.role !== "coach" || !member.userId) throw new Error("Acesso restrito à equipe LZ.");
  return member;
}

async function requireMember() {
  const member = await membership();
  if (member.role === "visitor" || !member.userId) throw new Error("Acesso reservado aos alunos do LZ.");
  return member;
}

export const getLzPlatform = createServerFn({ method: "GET" }).handler(async () => {
  const member = await membership();
  if (member.role === "visitor") {
    return { role: member.role, signedIn: !!member.userId, name: "", students: [], lessons: [], posts: [], cases: [] };
  }
  const db = getDb();
  const [lessons, posts, students, cases] = await Promise.all([
    db.select().from(fitnessLessons).where(eq(fitnessLessons.tenant, TENANT))
      .orderBy(desc(fitnessLessons.createdAt)).limit(50),
    db.select().from(fitnessPosts).where(and(eq(fitnessPosts.tenant, TENANT), eq(fitnessPosts.status, "published")))
      .orderBy(desc(fitnessPosts.createdAt)).limit(15),
    member.role === "coach"
      ? db.select().from(fitnessStudents).where(eq(fitnessStudents.tenant, TENANT))
          .orderBy(desc(fitnessStudents.createdAt)).limit(100)
      : Promise.resolve([]),
    member.role === "coach"
      ? db.select().from(fitnessAgentCases).where(eq(fitnessAgentCases.tenant, TENANT))
          .orderBy(desc(fitnessAgentCases.createdAt)).limit(30)
      : Promise.resolve([]),
  ]);
  // Never send author IDs, internal tenant/status, or staff notes to members.
  return {
    role: member.role,
    signedIn: true,
    name: member.name,
    students: students.map(({ id, fullName, email, phone, status, createdAt }) =>
      ({ id, fullName, email, phone, status, createdAt })),
    lessons: lessons.map(({ id, title, summary, category, videoUrl, createdAt }) =>
      ({ id, title, summary, category, videoUrl, createdAt })),
    posts: posts.map(({ id, authorId, authorName, body, imageData, createdAt }) =>
      ({ id, authorName, body, imageData, createdAt, mine: authorId === member.userId })),
    cases: cases.map(({ id, kind, situation, expectedAction, createdAt }) =>
      ({ id, kind, situation, expectedAction, createdAt })),
  };
});

export const enrollLzStudent = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { fullName?: unknown; email?: unknown; phone?: unknown };
    const fullName = clean(data?.fullName, 120);
    const email = emailOf(data?.email);
    const phone = clean(data?.phone, 32);
    if (fullName.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || phone.replace(/\D/g, "").length < 10)
      throw new Error("Informe nome, e-mail e telefone válidos.");
    return { fullName, email, phone };
  })
  .handler(async ({ data }) => {
    await requireCoach();
    const [created] = await getDb().insert(fitnessStudents)
      .values({ tenant: TENANT, ...data })
      .onConflictDoNothing()
      .returning({ id: fitnessStudents.id });
    return created
      ? { ok: true as const }
      : { ok: false as const, error: "Este e-mail já está cadastrado no LZ." };
  });

function videoUrl(input: unknown): string {
  const raw = clean(input, 300);
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("URL de vídeo inválida."); }
  if (url.protocol !== "https:") throw new Error("Use um vídeo HTTPS.");
  const host = url.hostname.toLowerCase();
  let id = "";
  if (host === "youtube.com" || host === "www.youtube.com") {
    id = url.searchParams.get("v") ?? "";
  } else if (host === "youtu.be") {
    id = url.pathname.slice(1);
  }
  if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
  if (host === "vimeo.com" || host === "www.vimeo.com") {
    id = url.pathname.slice(1);
    if (/^[0-9]{5,15}$/.test(id)) return `https://player.vimeo.com/video/${id}`;
  }
  throw new Error("Use um link de vídeo do YouTube ou Vimeo.");
}

export const addLzLesson = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { title?: unknown; summary?: unknown; category?: unknown; videoUrl?: unknown };
    const title = clean(data?.title, 120);
    const summary = clean(data?.summary, 700);
    const category = clean(data?.category, 20);
    if (title.length < 3 || !["treino", "cardio", "habitos"].includes(category))
      throw new Error("Título ou categoria inválidos.");
    return { title, summary, category, videoUrl: videoUrl(data?.videoUrl) };
  })
  .handler(async ({ data }) => {
    await requireCoach();
    await getDb().insert(fitnessLessons).values({ tenant: TENANT, ...data });
    return { ok: true as const };
  });

function image(input: unknown): string | null {
  if (!input) return null;
  if (typeof input !== "string") throw new Error("Foto inválida.");
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(input);
  if (!match || input.length > 480_000) throw new Error("Foto inválida ou maior que 350 KB.");
  const bytes = atob(match[2]);
  if (bytes.length > 350_000) throw new Error("Foto maior que 350 KB.");
  const magic =
    (match[1] === "jpeg" && bytes.charCodeAt(0) === 0xff && bytes.charCodeAt(1) === 0xd8) ||
    (match[1] === "png" && bytes.slice(0, 4) === "\x89PNG") ||
    (match[1] === "webp" && bytes.slice(0, 4) === "RIFF" && bytes.slice(8, 12) === "WEBP");
  if (!magic) throw new Error("Formato de imagem inválido.");
  return input;
}

export const addLzPost = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { body?: unknown; imageData?: unknown };
    const body = clean(data?.body, 500);
    const imageData = image(data?.imageData);
    if (!body && !imageData) throw new Error("Escreva algo ou escolha uma foto.");
    return { body, imageData };
  })
  .handler(async ({ data }) => {
    const member = await requireMember();
    const db = getDb();
    const [last] = await db.select({ createdAt: fitnessPosts.createdAt }).from(fitnessPosts)
      .where(and(eq(fitnessPosts.tenant, TENANT), eq(fitnessPosts.authorId, member.userId)))
      .orderBy(desc(fitnessPosts.createdAt)).limit(1);
    if (last && Date.now() - last.createdAt.getTime() < 60_000)
      return { ok: false as const, error: "Aguarde um minuto antes de publicar novamente." };
    await db.insert(fitnessPosts).values({
      tenant: TENANT, authorId: member.userId, authorName: member.name, ...data,
    });
    return { ok: true as const };
  });

export const hideLzPost = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({ id: clean((input as { id?: unknown })?.id, 64) }))
  .handler(async ({ data }) => {
    const member = await requireMember();
    await getDb().update(fitnessPosts).set({ status: "hidden" })
      .where(and(
        eq(fitnessPosts.id, data.id),
        eq(fitnessPosts.tenant, TENANT),
        ...(member.role === "coach" ? [] : [eq(fitnessPosts.authorId, member.userId)]),
      ));
    return { ok: true as const };
  });

export const setLzStudentStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { id?: unknown; status?: unknown };
    const id = clean(data?.id, 64);
    const status = clean(data?.status, 12);
    if (!id || !["active", "inactive"].includes(status)) throw new Error("Alteração inválida.");
    return { id, status };
  })
  .handler(async ({ data }) => {
    await requireCoach();
    await getDb().update(fitnessStudents).set({ status: data.status })
      .where(and(eq(fitnessStudents.id, data.id), eq(fitnessStudents.tenant, TENANT)));
    return { ok: true as const };
  });

export const recordLzAgentCase = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { kind?: unknown; situation?: unknown; expectedAction?: unknown };
    const kind = clean(data?.kind, 20);
    const situation = clean(data?.situation, 700);
    const expectedAction = clean(data?.expectedAction, 700);
    if (!["conteudo", "alunos", "seguranca"].includes(kind) || situation.length < 10 || expectedAction.length < 10)
      throw new Error("Descreva o cenário e a ação esperada.");
    return { kind, situation, expectedAction };
  })
  .handler(async ({ data }) => {
    const coach = await requireCoach();
    await getDb().insert(fitnessAgentCases).values({
      tenant: TENANT, createdBy: coach.userId, ...data,
    });
    return { ok: true as const };
  });
