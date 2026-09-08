import { ArrowUpRight, BarChart3, Play, Radio, Target } from "lucide-react";
import type { Beat } from "@/lib/beats";

const OWNED_STORIES = [
  {
    eyebrow: "Operação própria",
    title: "Veronica Wire entra em ritmo de cobertura contínua",
    description: "Uma nova publicação por hora, conectando notícia, aprendizado e execução.",
    href: "/comandos?utm_source=wire&utm_medium=owned_story&utm_campaign=wire_24h",
    cta: "Conhecer os comandos",
    image: "/veronica-cyborg-v2.webp",
    icon: Radio,
    external: false,
  },
  {
    eyebrow: "Produto em foco",
    title: "Veronica Analytics transforma tendências em rotas de venda",
    description: "Descubra produtos, sinais de mercado e oportunidades para conteúdo comercial.",
    href: "/veronica-analytics?utm_source=wire&utm_medium=owned_story&utm_campaign=analytics",
    cta: "Abrir Analytics",
    image: "/veronica-depth.webp",
    icon: BarChart3,
    external: false,
  },
  {
    eyebrow: "Meta da comunidade",
    title: "Rumo aos primeiros 1.000 inscritos no canal da Veronica",
    description: "Notícias em vídeo, análises rápidas e bastidores da construção do ecossistema.",
    href: "https://youtube.com/@veronica-hub?sub_confirmation=1&utm_source=wire&utm_medium=owned_story&utm_campaign=community_goal",
    cta: "Participar da meta",
    image: "/veronica-hero-sm.webp",
    icon: Target,
    external: true,
  },
] as const;

const ACTION_BY_BEAT: Record<
  Beat,
  { eyebrow: string; title: string; description: string; href: string; cta: string }
> = {
  ia: {
    eyebrow: "Da notícia à criação",
    title: "Transforme esta tendência em imagem, vídeo e campanha",
    description: "Use os fluxos do Veronica Studio para sair da leitura e produzir com IA.",
    href: "/video-ia?utm_source=wire&utm_medium=article_action&utm_campaign=studio",
    cta: "Criar no Studio",
  },
  clima: {
    eyebrow: "Da notícia à narrativa",
    title: "Converta dados complexos em conteúdo que as pessoas entendem",
    description: "Aprenda roteiro, copy e produção visual para explicar tendências com clareza.",
    href: "/comandos?utm_source=wire&utm_medium=article_action&utm_campaign=commands",
    cta: "Explorar comandos",
  },
  economia: {
    eyebrow: "Da notícia à oportunidade",
    title: "Encontre os sinais comerciais por trás do movimento econômico",
    description: "Use o Veronica Analytics para investigar demanda, produtos e conteúdo de venda.",
    href: "/veronica-analytics?utm_source=wire&utm_medium=article_action&utm_campaign=analytics",
    cta: "Analisar oportunidades",
  },
  geopolitica: {
    eyebrow: "Do contexto à estratégia",
    title: "Aprenda a transformar movimentos globais em comunicação relevante",
    description: "Domine pesquisa, roteiro e copy com os comandos práticos da Veronica.",
    href: "/comandos?utm_source=wire&utm_medium=article_action&utm_campaign=commands",
    cta: "Ver formações",
  },
  mercado: {
    eyebrow: "Do sinal à venda",
    title: "Veja quais tendências podem virar produto, conteúdo e comissão",
    description: "Continue no Veronica Analytics e transforme informação de mercado em decisão.",
    href: "/veronica-analytics?utm_source=wire&utm_medium=article_action&utm_campaign=analytics",
    cta: "Abrir radar de produtos",
  },
};

export function WireOwnedStories() {
  return (
    <section aria-labelledby="wire-owned-title" className="border-b border-border/40 bg-surface/20 py-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="font-mono-tech text-[9px] uppercase tracking-[0.24em] text-neon-green">
              Conteúdo da casa · Veronica Hub
            </div>
            <h2 id="wire-owned-title" className="mt-1 font-display text-xl text-foreground sm:text-2xl">
              Veronica em movimento
            </h2>
          </div>
          <span className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
            Produtos · operação · comunidade
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {OWNED_STORIES.map((story, index) => {
            const Icon = story.icon;
            return (
              <a
                key={story.title}
                href={story.href}
                target={story.external ? "_blank" : undefined}
                rel={story.external ? "noopener noreferrer" : undefined}
                className="group relative min-h-56 overflow-hidden rounded-sm border border-border/60 bg-background"
              >
                <img
                  src={story.image}
                  alt=""
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-700 group-hover:scale-105 group-hover:opacity-45"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/20" />
                <div className="relative flex min-h-56 flex-col justify-end p-5">
                  <div className="flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-widest text-neon-green">
                    <Icon className="h-3.5 w-3.5" />
                    {story.eyebrow}
                  </div>
                  <h3 className="mt-2 font-display text-xl leading-tight text-foreground">{story.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{story.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-neon-green">
                    {story.cta} <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function WireArticleAction({ beat }: { beat: Beat }) {
  const action = ACTION_BY_BEAT[beat];

  return (
    <aside className="mt-10 overflow-hidden rounded-sm border border-neon-green/30 bg-neon-green/5 p-6 sm:p-7">
      <div className="flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-neon-green">
        <Play className="h-3.5 w-3.5" /> {action.eyebrow}
      </div>
      <h2 className="mt-3 font-display text-2xl leading-tight text-foreground">{action.title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {action.description}
      </p>
      <a
        href={action.href}
        className="mt-5 inline-flex items-center gap-2 rounded-sm bg-neon-green px-4 py-2.5 font-mono-tech text-[10px] uppercase tracking-widest text-primary-foreground transition hover:brightness-110"
      >
        {action.cta} <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
      <p className="mt-3 text-[10px] text-muted-foreground/70">
        Recomendação de produto próprio da Veronica Hub.
      </p>
    </aside>
  );
}
