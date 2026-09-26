/**
 * Conteúdo da página pública do LZ Team (marca pública: LZ Training Club).
 *
 * Tudo aqui é real — copiado do site atual do Coach (lucastomaz.lovable.app),
 * do Instagram @lz.trainingclub e do roteiro de VSL já gravado. Regra da casa:
 * nenhum número, depoimento ou imagem inventado. O que ainda falta fica
 * marcado como `A_CONFIRMAR` e aparece assim na página, de propósito.
 *
 * Para atualizar texto: editar este arquivo (pelo Lovable ou por commit).
 * Para trocar foto: subir pelo /admin/imagens com o nome de arquivo do slot
 * (ver `LZ_IMAGE_SLOTS`) — a página pega a versão mais recente sozinha.
 */

export const A_CONFIRMAR = "[A CONFIRMAR]";

export const LZ_SEAL_SERIAL = "VH-MEM-2026-000002";

export const lzIdentity = {
  brand: "LZ Training Club",
  internalName: "LZ Team",
  coach: "Lucas Tomaz",
  cref: "CREF 006936-PJ/SC",
  coachTitle: "Atleta amador de fisiculturismo",
  instagramHandle: "@lz.trainingclub",
  instagramUrl: "https://www.instagram.com/lz.trainingclub/",
  whatsappUrl: "https://wa.me/5547996078242",
  bio: ["Experts em hipertrofia e definição.", "Acompanhamento premium"],
} as const;

export const lzHero = {
  headline:
    "Eleve seu físico e sua mente ao próximo nível com a consultoria estratégica do Coach Lucas Tomaz.",
  primaryCta: "Quero ser Alta Performance",
  secondaryCta: "Seguir @lz.trainingclub",
  manifestoLine:
    "Se você treina pesado, mas não acompanha nada, está apenas se esforçando no escuro.",
} as const;

export const lzAuthority = [
  { value: lzIdentity.cref, label: "Registro profissional" },
  { value: "12 anos", label: "de treino intenso" },
  { value: "5 anos", label: "dedicados à consultoria personalizada" },
  {
    value: "+2.000",
    label: "alunos transformados na “Fábrica de Resultados” — como atleta e treinador",
  },
] as const;

export const lzMethod = {
  pillars: [
    {
      title: "Treinos com Execução Correta",
      body: "Cada exercício é detalhado no app com vídeos de execução para garantir técnica impecável e máxima eficiência em cada série",
    },
    {
      title: "Planejamento Alimentar Dinâmico",
      body: "Dieta estratégica e ajustável de acordo com seus objetivos. Tudo atualizado no app em tempo real",
    },
    {
      title: "Feedback Quinzenal com o Coach",
      body: "Comunicação direta com o Coach Lucas a cada 15 dias para ajustes",
    },
  ],
  closing: "Tecnologia e acompanhamento de elite na palma da sua mão",
} as const;

export const lzAbout = {
  eyebrow: "Sobre o Coach",
  title: "Trajetória de Elite",
  body: "Lucas Tomaz construiu sua autoridade vivendo o que prega — no palco, na academia e na vida.",
  educationTitle: "Formação de Alto Nível",
  education: [
    "Especializações presenciais com Fabricio Pacholok — considerado o melhor treinador do mundo",
    "“Musculação Faixa Preta” com Felipe Pereira",
    "Curso especializado em treinamento feminino com Luiz Sales (Expert Growth)",
    "Certificações e seminários: “Técnica com Brutalidade” (Overall Gym) · “Personal Faixa Preta” (Ironberg) · “International Bodybuilding Seminar” (Overall Gym / The Brazilian Mecca)",
  ],
} as const;

export const lzValues = [
  { title: "Técnica", body: "Execução perfeita em cada movimento. Sem atalhos, sem achismo." },
  {
    title: "Intensidade",
    body: "Cada treino é uma oportunidade de superação. Dê tudo ou vá pra casa.",
  },
  { title: "Disciplina", body: "Consistência derrota talento. Todos os dias, sem exceção." },
] as const;

export const lzManifesto = "NÃO FOI SORTE. FOI PROCESSO.";

export const lzConversion = {
  title: "Aplicar para acompanhamento",
  body: "Conte seu objetivo. O Coach Lucas recebe sua aplicação e retorna pelo WhatsApp.",
  cta: "Aplicar para acompanhamento",
  goals: ["Hipertrofia", "Definição", "Outro"],
} as const;

/**
 * Slots de imagem. Cada foto vive na tabela MediaImage (upload em
 * /admin/imagens) e é encontrada pelo nome de arquivo `lz-team--<slot>.<ext>`.
 * Enquanto o arquivo não existir no banco, a página mostra `A_CONFIRMAR`
 * naquele lugar — nunca uma imagem genérica no lugar da foto real.
 */
export const LZ_IMAGE_SLOTS = {
  "hero-coach": {
    alt: "Coach Lucas Tomaz — foto de capa",
    source: "lucastomaz.lovable.app/assets/hero-coach-liot94rZ.png",
  },
  "about-coach": {
    alt: "Lucas Tomaz em competição de fisiculturismo",
    source: "lucastomaz.lovable.app/assets/about-coach-ycngvLd9.png",
  },
  "gallery-1": {
    alt: "Lucas Tomaz com atleta na academia",
    source: "lucastomaz.lovable.app/assets/gallery-1-GhWsEwtj.png",
  },
  "gallery-2": {
    alt: "Lucas Tomaz em competição com medalha",
    source: "lucastomaz.lovable.app/assets/gallery-2-DIaHGZ5w.png",
  },
  "gallery-3": {
    alt: "Lucas Tomaz posando no palco",
    source: "lucastomaz.lovable.app/assets/gallery-3-WCWdue1j.png",
  },
  "cert-tecnica-brutalidade": {
    alt: "Certificado “Técnica com Brutalidade”",
    source: "lucastomaz.lovable.app/assets/cert-tecnica-brutalidade-w2F1YRWt.png",
  },
  "cert-international-seminar": {
    alt: "Certificado “International Bodybuilding Seminar”",
    source: "lucastomaz.lovable.app/assets/cert-international-seminar-sEN0J0-i.png",
  },
  "cert-faixa-preta": {
    alt: "Certificado “Personal Faixa Preta”",
    source: "lucastomaz.lovable.app/assets/cert-faixa-preta-CF-SwJDM.png",
  },
} as const;

export type LzImageSlot = keyof typeof LZ_IMAGE_SLOTS;

export const LZ_IMAGE_FILENAME_PREFIX = "lz-team--";

/** `lz-team--gallery-1.png` → `gallery-1`; qualquer outro nome → null. */
export function slotFromFilename(filename: string): LzImageSlot | null {
  if (!filename.startsWith(LZ_IMAGE_FILENAME_PREFIX)) return null;
  const slot = filename.slice(LZ_IMAGE_FILENAME_PREFIX.length).replace(/\.[a-z0-9]+$/i, "");
  return slot in LZ_IMAGE_SLOTS ? (slot as LzImageSlot) : null;
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
export type LzUtm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/** Só as UTMs de campanha, com tamanho limitado — nada mais da query string. */
export function pickUtm(search: string | URLSearchParams): LzUtm {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const utm: LzUtm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) utm[key] = value.slice(0, 120);
  }
  return utm;
}

/**
 * Link do WhatsApp com a mensagem inicial. As UTMs vão no texto, que é o
 * único lugar onde elas sobrevivem até a conversa — assim o Coach sabe de
 * qual campanha o contato veio.
 */
export function whatsappLink(message: string, utm: LzUtm): string {
  const origin = [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join(" / ");
  const text = origin ? `${message}\n\n[origem: ${origin}]` : message;
  return `${lzIdentity.whatsappUrl}?text=${encodeURIComponent(text)}`;
}
