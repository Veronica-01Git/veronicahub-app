// ---------------------------------------------------------------------------
// Currículo-Certo — motor de avaliação e geração, 100% determinístico.
// Sem IA, sem backend: roda inteiro no navegador.
// ---------------------------------------------------------------------------

const ACTION_VERBS = [
  "liderei", "desenvolvi", "criei", "implementei", "aumentei", "reduzi", "gerenciei",
  "coordenei", "otimizei", "automatizei", "negociei", "conduzi", "executei", "planejei",
  "estruturei", "elaborei", "construí", "lancei", "entreguei", "superei", "ampliei",
  "melhorei", "resolvi", "analisei", "identifiquei", "treinei", "capacitei",
  "supervisionei", "organizei", "revisei", "padronizei", "implantei", "migrei",
  "integrei", "projetei", "escalei", "conquistei", "alcancei", "atingi", "formei",
  "mentorei", "apresentei", "publiquei", "captei", "orcei", "diagnostiquei",
];

const BUZZWORDS = [
  "proativo", "proativa", "dinâmico", "dinâmica", "team player", "trabalho em equipe",
  "excelente comunicação", "facilidade de aprendizado", "comprometido", "comprometida",
  "motivado", "motivada", "responsável", "organizado", "organizada", "sinergia",
  "fora da caixa",
];

const ICON_GLYPH_TEST = /[-]/;
const ICON_GLYPH_REPLACE = /[-]/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}/;
const LINKEDIN_RE = /linkedin\.com\/[\w-/]+|github\.com\/[\w-/]+/i;
const EXP_HEADER_RE = /experi[êe]ncia|hist[óo]rico profissional/i;
const EDU_HEADER_RE = /forma[çc][ãa]o|educa[çc][ãa]o|escolaridade/i;
const SKILLS_HEADER_RE = /habilidades|compet[êe]ncias\b|skills/i;

export type Check = {
  key: string;
  label: string;
  weight: number;
  points: number;
  detail: string;
};

export type EvalResult = {
  score: number;
  potential: number;
  maxScore: number;
  protocol: string;
  issuedAt: string;
  checks: Check[];
};

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function stripBullet(line: string): string {
  return line.replace(/^([-•*▪●]|\d+[.)])\s+/, "");
}

export function evaluateResume(rawText: string): EvalResult {
  const text = rawText.trim();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const bulletLines = lines.filter((l) => /^([-•*▪●]|\d+[.)])\s+/.test(l));
  const candidateLines = bulletLines.length >= 3
    ? bulletLines
    : lines.filter((l) => l.length >= 20 && l.length <= 220 && !/^[A-ZÀ-Ú\s]+$/.test(l));

  const verbMatches = candidateLines.filter((l) => {
    const first = stripBullet(l).trim().split(/\s+/)[0]?.toLowerCase().replace(/[.,;:]+$/, "") ?? "";
    return ACTION_VERBS.includes(first);
  }).length;
  const verbRatio = candidateLines.length > 0 ? verbMatches / candidateLines.length : 0;
  const verbPoints = candidateLines.length >= 3 ? Math.round(16 * Math.min(verbRatio, 1)) : 0;

  const quantRegex = /%|R\$|\b\d+\s?(mil|milh(ão|ões)?|k|x|vezes|clientes|usuários|pessoas|equipe)\b/i;
  const quantCount = candidateLines.filter((l) => quantRegex.test(l)).length;
  const quantPoints = Math.min(16, Math.round((quantCount / 3) * 16));

  const hasEmail = EMAIL_RE.test(text);
  const hasPhone = PHONE_RE.test(text);
  const hasLinkedin = LINKEDIN_RE.test(text);

  const expSection = EXP_HEADER_RE.test(text);
  const eduSection = EDU_HEADER_RE.test(text);
  const skillsSection = SKILLS_HEADER_RE.test(text);

  const sizeOk = wordCount >= 200 && wordCount <= 900;

  const aboutMatch = text.match(/(sobre mim|objetivo|perfil profissional|resumo profissional)[:\s]*/i);
  let aboutOk = true;
  if (aboutMatch && aboutMatch.index !== undefined) {
    const slice = text.slice(aboutMatch.index + aboutMatch[0].length, aboutMatch.index + aboutMatch[0].length + 500);
    const words = slice.trim().split(/\s+/).filter(Boolean).length;
    aboutOk = words <= 70;
  }

  const hasIconGlyphs = ICON_GLYPH_TEST.test(text);

  const buzzCount = BUZZWORDS.reduce((sum, term) => {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    return sum + (text.match(re)?.length ?? 0);
  }, 0);
  const buzzPoints = buzzCount <= 2 ? 8 : Math.max(0, 8 - (buzzCount - 2) * 2);

  const checks: Check[] = [
    {
      key: "contato",
      label: "E-mail e telefone visíveis",
      weight: 8,
      points: hasEmail && hasPhone ? 8 : 0,
      detail: hasEmail && hasPhone
        ? "E-mail e telefone identificados no texto."
        : "Não identificamos e-mail e telefone juntos. Inclua os dois no topo do currículo.",
    },
    {
      key: "linkedin",
      label: "LinkedIn ou portfólio",
      weight: 4,
      points: hasLinkedin ? 4 : 0,
      detail: hasLinkedin
        ? "Link de LinkedIn/GitHub encontrado."
        : "Adicione o link do seu LinkedIn (ou portfólio) perto do contato.",
    },
    {
      key: "sec-exp",
      label: "Seção “Experiência”",
      weight: 6,
      points: expSection ? 6 : 0,
      detail: expSection ? "Seção de experiência identificada." : "Inclua uma seção com o título “Experiência Profissional”.",
    },
    {
      key: "sec-edu",
      label: "Seção “Formação”",
      weight: 6,
      points: eduSection ? 6 : 0,
      detail: eduSection ? "Seção de formação identificada." : "Inclua uma seção com o título “Formação”.",
    },
    {
      key: "sec-skills",
      label: "Seção “Habilidades”",
      weight: 6,
      points: skillsSection ? 6 : 0,
      detail: skillsSection ? "Seção de habilidades identificada." : "Inclua uma seção com o título “Habilidades” ou “Competências”.",
    },
    {
      key: "verbos",
      label: "Verbos de ação nos destaques",
      weight: 16,
      points: verbPoints,
      detail: verbPoints >= 14
        ? "A maioria das linhas começa com verbo de ação forte."
        : `Comece cada linha de experiência com um verbo de ação (Liderei, Criei, Reduzi...). Hoje ${Math.round(verbRatio * 100)}% seguem esse padrão.`,
    },
    {
      key: "quant",
      label: "Resultados quantificados",
      weight: 16,
      points: quantPoints,
      detail: quantPoints >= 14
        ? "Bom volume de resultados com número, % ou R$."
        : `Adicione números, % ou R$ nos resultados. Encontramos ${quantCount} linha(s) quantificada(s) — a meta é 3 ou mais.`,
    },
    {
      key: "tamanho",
      label: "Tamanho do documento",
      weight: 10,
      points: sizeOk ? 10 : 0,
      detail: sizeOk
        ? `${wordCount} palavras — dentro da faixa ideal.`
        : wordCount < 200
          ? `Currículo curto (${wordCount} palavras). Detalhe mais suas experiências.`
          : `Currículo longo (${wordCount} palavras). Corte para até 900 palavras (1–2 páginas).`,
    },
    {
      key: "sobre-mim",
      label: "Apresentação enxuta",
      weight: 8,
      points: aboutOk ? 8 : 0,
      detail: aboutOk
        ? "Sem parágrafo de apresentação longo demais."
        : "Corte ou resuma o parágrafo de apresentação — recrutador não lê texto corrido longo.",
    },
    {
      key: "icones",
      label: "Sem ícones ilegíveis para o ATS",
      weight: 8,
      points: hasIconGlyphs ? 0 : 8,
      detail: hasIconGlyphs
        ? "Detectamos caracteres de fonte de ícone (comuns em telefone/e-mail) que o ATS não lê. Troque por texto simples (“Tel:”, “E-mail:”)."
        : "Nenhum caractere de ícone ilegível encontrado.",
    },
    {
      key: "cliches",
      label: "Sem clichês em excesso",
      weight: 8,
      points: buzzPoints,
      detail: buzzPoints >= 8
        ? "Baixa densidade de termos genéricos."
        : `Reduza termos genéricos (“proativo”, “dinâmico”...). Encontramos ${buzzCount} ocorrência(s) — troque por resultados concretos.`,
    },
  ];

  const maxScore = checks.reduce((s, c) => s + c.weight, 0);
  const score = checks.reduce((s, c) => s + c.points, 0);
  const potential = score < maxScore ? maxScore : score;

  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String((hashCode(text) % 9000) + 1000);

  return {
    score,
    potential,
    maxScore,
    protocol: `CC-${yy}${mm}-${seq}`,
    issuedAt: now.toLocaleDateString("pt-BR"),
    checks,
  };
}

// ---------------------------------------------------------------------------
// Geração — reformatação determinística no padrão ATS (sem IA, sem reescrita
// de conteúdo). Reorganiza o que já existe: cabeçalhos padronizados, bullets
// normalizados, ícones ilegíveis removidos, coluna única. Nada do conteúdo
// original é descartado — seções não reconhecidas são preservadas no fim.
// ---------------------------------------------------------------------------

export type AtsSection = { title: string; body: string };

export type AtsResume = {
  name: string;
  contactLine: string;
  sections: AtsSection[];
  text: string;
};

function isHeaderLine(line: string): boolean {
  if (line.length === 0 || line.length > 40) return false;
  if (/^([-•*▪●]|\d+[.)])\s+/.test(line)) return false;
  if (/[.,;:]$/.test(line)) return false;
  if (EMAIL_RE.test(line) || PHONE_RE.test(line)) return false;
  const isAllCaps = line === line.toUpperCase() && /[A-ZÀ-Ú]/.test(line);
  const isTitleCase = /^[A-ZÀ-Ú][a-zà-ú]+(\s[A-ZÀ-Ú][a-zà-ú]+){0,4}$/.test(line);
  return isAllCaps || isTitleCase;
}

function canonicalTitle(title: string): string {
  if (EXP_HEADER_RE.test(title)) return "EXPERIÊNCIA PROFISSIONAL";
  if (EDU_HEADER_RE.test(title)) return "FORMAÇÃO";
  if (SKILLS_HEADER_RE.test(title)) return "HABILIDADES";
  return title.toUpperCase();
}

function normalizeBody(title: string, body: string[]): string {
  const isExperience = /EXPERI[ÊE]NCIA/.test(title);
  return body
    .map((l) => (isExperience ? `- ${stripBullet(l)}` : l))
    .join("\n");
}

export function generateAtsResume(rawText: string): AtsResume {
  const clean = rawText.replace(ICON_GLYPH_REPLACE, "").trim();
  const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // A resume's first line is conventionally the candidate's name — never
  // treat it (or the contact block right under it) as a section header,
  // even if it happens to look like title case ("João Silva").
  const contactIdx = lines.findIndex((l, i) => i < 6 && (EMAIL_RE.test(l) || PHONE_RE.test(l) || LINKEDIN_RE.test(l)));
  const scanStart = contactIdx >= 0 ? contactIdx + 1 : 1;
  const headerIdx: number[] = [];
  for (let i = scanStart; i < lines.length; i++) if (isHeaderLine(lines[i])) headerIdx.push(i);

  const name = lines[0] ?? "Seu nome";

  const emailMatch = clean.match(EMAIL_RE)?.[0];
  const phoneMatch = clean.match(PHONE_RE)?.[0];
  const linkedinMatch = clean.match(LINKEDIN_RE)?.[0];
  const contactLine = [emailMatch, phoneMatch, linkedinMatch].filter(Boolean).join(" · ");

  const rawSections: { title: string; body: string[] }[] = [];
  for (let i = 0; i < headerIdx.length; i++) {
    const start = headerIdx[i] + 1;
    const end = headerIdx[i + 1] ?? lines.length;
    rawSections.push({ title: lines[headerIdx[i]], body: lines.slice(start, end) });
  }

  const order = ["EXPERIÊNCIA PROFISSIONAL", "FORMAÇÃO", "HABILIDADES"];
  const canonical = rawSections.map((s) => ({ title: canonicalTitle(s.title), body: s.body }));
  const sections: AtsSection[] = [
    ...order
      .map((title) => canonical.find((s) => s.title === title))
      .filter((s): s is { title: string; body: string[] } => Boolean(s))
      .map((s) => ({ title: s.title, body: normalizeBody(s.title, s.body) })),
    ...canonical
      .filter((s) => !order.includes(s.title))
      .map((s) => ({ title: s.title, body: normalizeBody(s.title, s.body) })),
  ];

  const text = [
    name,
    contactLine,
    "",
    ...sections.flatMap((s) => [s.title, s.body, ""]),
  ].join("\n").trim();

  return { name, contactLine, sections, text };
}

// ---------------------------------------------------------------------------
// Triagem RH — compara um currículo contra os requisitos de uma vaga. Reusa
// o mesmo motor de avaliação ATS; não depende de IA, roda inteiro no navegador.
// ---------------------------------------------------------------------------

export type JobRequirements = {
  keywords: string[];
  requireExperience: boolean;
  requireEducation: boolean;
  requireSkills: boolean;
};

export type CandidateMatch = {
  name: string;
  atsScore: number;
  atsMax: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingRequirements: string[];
  matchPercent: number;
  pass: boolean;
};

export function matchAgainstJob(resumeText: string, job: JobRequirements): CandidateMatch {
  const evalResult = evaluateResume(resumeText);
  const text = resumeText.toLowerCase();
  const keywords = job.keywords.map((k) => k.trim()).filter(Boolean);
  const matchedKeywords = keywords.filter((k) => text.includes(k.toLowerCase()));
  const missingKeywords = keywords.filter((k) => !matchedKeywords.includes(k));

  const missingRequirements: string[] = [];
  if (job.requireExperience && !EXP_HEADER_RE.test(resumeText)) missingRequirements.push("Seção Experiência");
  if (job.requireEducation && !EDU_HEADER_RE.test(resumeText)) missingRequirements.push("Seção Formação");
  if (job.requireSkills && !SKILLS_HEADER_RE.test(resumeText)) missingRequirements.push("Seção Habilidades");

  const requirementCount = [job.requireExperience, job.requireEducation, job.requireSkills].filter(Boolean).length;
  const requirementsMet = requirementCount - missingRequirements.length;
  const keywordPct = keywords.length > 0 ? matchedKeywords.length / keywords.length : 1;
  const requirementPct = requirementCount > 0 ? requirementsMet / requirementCount : 1;
  const matchPercent = Math.round(keywordPct * 70 + requirementPct * 30);

  const lines = resumeText.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const name = lines[0] || "Candidato";

  return {
    name,
    atsScore: evalResult.score,
    atsMax: evalResult.maxScore,
    matchedKeywords,
    missingKeywords,
    missingRequirements,
    matchPercent,
    pass: matchPercent >= 70 && missingRequirements.length === 0,
  };
}
