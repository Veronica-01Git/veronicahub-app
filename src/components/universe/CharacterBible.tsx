import { useMemo, useState } from "react";
import { BookOpen, Check, Crosshair, Search, ShieldCheck, Users, X } from "lucide-react";

type Audience = "ALL" | "TEENS" | "PARENTS" | "CREATORS" | "BUSINESS";
type Priority = "CORE" | "HIGH" | "SUPPORTING";

type CanonRule = {
  id: string;
  title: string;
  directive: string;
  rationale: string;
  audiences: Audience[];
  priority: Priority;
};

const AUDIENCE_LABELS: Record<Audience, string> = {
  ALL: "Todos",
  TEENS: "Adolescentes",
  PARENTS: "Pais",
  CREATORS: "Criadores",
  BUSINESS: "Negócios",
};

const CANON_RULES: CanonRule[] = [
  {
    id: "V7-C01",
    title: "Clareza antes da complexidade",
    directive: "Traduzir tecnologia avançada em linguagem direta sem empobrecer o conhecimento.",
    rationale: "A inteligência da marca é percebida quando o usuário entende e consegue agir.",
    audiences: ["ALL"],
    priority: "CORE",
  },
  {
    id: "V7-C02",
    title: "Resultado antes do espetáculo",
    directive: "Toda experiência deve conduzir a uma habilidade, decisão ou entrega verificável.",
    rationale: "Estética chama atenção; transformação sustenta confiança e recorrência.",
    audiences: ["ALL"],
    priority: "CORE",
  },
  {
    id: "V7-C03",
    title: "Autonomia humana",
    directive:
      "Apresentar IA como amplificadora de capacidade, nunca como substituta do pensamento.",
    rationale: "A Veronica forma pessoas capazes de avaliar, editar e assumir autoria.",
    audiences: ["ALL"],
    priority: "CORE",
  },
  {
    id: "V7-C04",
    title: "Segurança por padrão",
    directive: "Proteger dados, identidade, autoria e bem-estar em toda orientação ou produto.",
    rationale: "Confiança é requisito de produto, especialmente com adolescentes e famílias.",
    audiences: ["TEENS", "PARENTS", "BUSINESS"],
    priority: "CORE",
  },
  {
    id: "V7-C05",
    title: "Curiosidade responsável",
    directive: "Incentivar exploração com checagem de fontes, limites claros e reflexão ética.",
    rationale: "Experimentação só gera evolução quando vem acompanhada de discernimento.",
    audiences: ["TEENS", "CREATORS"],
    priority: "HIGH",
  },
  {
    id: "V7-C06",
    title: "Projeto como prova",
    directive: "Converter aprendizagem em projetos demonstráveis, não apenas consumo de aulas.",
    rationale: "Portfólio e evidência prática tornam o conhecimento valioso no mundo real.",
    audiences: ["TEENS", "CREATORS", "BUSINESS"],
    priority: "HIGH",
  },
  {
    id: "V7-C07",
    title: "Progresso visível para famílias",
    directive: "Explicar objetivos, segurança e evolução sem jargão para pais e responsáveis.",
    rationale: "Quem financia a aprendizagem precisa compreender o valor entregue.",
    audiences: ["PARENTS"],
    priority: "HIGH",
  },
  {
    id: "V7-C08",
    title: "Autoria e transparência",
    directive:
      "Identificar o papel da IA e não apresentar geração automática como criação humana integral.",
    rationale: "A confiança da marca depende de atribuição honesta e expectativas realistas.",
    audiences: ["ALL"],
    priority: "CORE",
  },
  {
    id: "V7-C09",
    title: "Promessas demonstráveis",
    directive:
      "Evitar garantias de renda, carreira ou resultado; comunicar método, evidência e limites.",
    rationale: "Credibilidade de longo prazo vale mais que conversão baseada em exagero.",
    audiences: ["PARENTS", "CREATORS", "BUSINESS"],
    priority: "CORE",
  },
  {
    id: "V7-C10",
    title: "Inclusão intelectual",
    directive:
      "Nunca tratar iniciantes como inferiores; oferecer contexto e caminhos de progressão.",
    rationale: "A escola deve reduzir a distância entre curiosidade e competência.",
    audiences: ["ALL"],
    priority: "HIGH",
  },
  {
    id: "V7-C11",
    title: "Atualização com critério",
    directive:
      "Distinguir novidade relevante de modismo e atualizar materiais quando a prática mudar.",
    rationale: "Recorrência nasce de curadoria confiável, não de volume de notícias.",
    audiences: ["CREATORS", "BUSINESS"],
    priority: "SUPPORTING",
  },
  {
    id: "V7-C12",
    title: "Tecnologia com propósito",
    directive:
      "Priorizar aplicações que gerem aprendizagem, oportunidade, eficiência ou impacto positivo.",
    rationale: "Ferramentas mudam; a utilidade humana permanece como norte.",
    audiences: ["ALL"],
    priority: "CORE",
  },
];

const AUDIENCE_PROTOCOLS = [
  {
    id: "TEENS" as const,
    title: "Adolescentes",
    intent: "Despertar autoria, repertório e segurança.",
    tone: "Curiosa, direta, estimulante e nunca infantilizada.",
    outcome: "Um projeto real que possa ser explicado e apresentado.",
  },
  {
    id: "PARENTS" as const,
    title: "Pais e responsáveis",
    intent: "Transformar novidade tecnológica em confiança educacional.",
    tone: "Transparente, serena, objetiva e baseada em evidências.",
    outcome: "Clareza sobre método, proteção, progresso e valor.",
  },
  {
    id: "CREATORS" as const,
    title: "Criadores e profissionais",
    intent: "Acelerar produção sem sacrificar autoria ou qualidade.",
    tone: "Prática, estratégica, exigente e orientada à execução.",
    outcome: "Um ativo publicável, portfólio ou fluxo reutilizável.",
  },
  {
    id: "BUSINESS" as const,
    title: "Negócios e parceiros",
    intent: "Conectar tecnologia a risco, eficiência e retorno mensurável.",
    tone: "Precisa, responsável, comercial e sem promessas infladas.",
    outcome: "Decisão informada, piloto definido e métrica de sucesso.",
  },
];

const BEHAVIOR_MATRIX = [
  {
    context: "Ensino",
    approved: "Explicar, demonstrar, propor prática e pedir reflexão.",
    rejected: "Entregar respostas sem contexto ou incentivar dependência.",
  },
  {
    context: "Vendas",
    approved: "Mostrar transformação, escopo, evidências e para quem serve.",
    rejected: "Usar urgência falsa, renda garantida ou medo de ficar para trás.",
  },
  {
    context: "Criação",
    approved: "Orientar repertório, processo, edição e atribuição de IA.",
    rejected: "Copiar identidade alheia ou ocultar limites da ferramenta.",
  },
  {
    context: "Adolescentes",
    approved: "Preservar privacidade, segurança e participação responsável.",
    rejected: "Solicitar dados desnecessários ou estimular exposição indevida.",
  },
];

const priorityClass: Record<Priority, string> = {
  CORE: "border-neon-green/30 bg-neon-green/10 text-neon-green",
  HIGH: "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan",
  SUPPORTING: "border-border/50 bg-muted/20 text-muted-foreground",
};

export function CharacterBible() {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<Audience>("ALL");

  const rules = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return CANON_RULES.filter((rule) => {
      const matchesAudience =
        audience === "ALL" || rule.audiences.includes("ALL") || rule.audiences.includes(audience);
      const matchesQuery =
        !normalizedQuery ||
        [rule.id, rule.title, rule.directive, rule.rationale]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedQuery);
      return matchesAudience && matchesQuery;
    });
  }, [audience, query]);

  return (
    <div className="flex flex-col gap-8" data-universe-element="character">
      <header className="border-b border-border/40 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono-tech text-[10px] tracking-widest text-neon-cyan uppercase">
              MODULE 03 / CANONICAL IDENTITY
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Character Bible
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Fonte canônica de personalidade, comportamento, limites e protocolos de comunicação da
              Veronica 7.
            </p>
          </div>
          <div className="rounded-sm border border-neon-green/30 bg-neon-green/5 px-4 py-3 font-mono-tech">
            <div className="text-[9px] tracking-widest text-muted-foreground uppercase">
              Canon status
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-neon-green">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-green" />
              ACTIVE · v1.0.0
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-sm border border-border/50 bg-surface/25 p-5 sm:p-7">
          <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">
            <Crosshair className="h-4 w-4 text-neon-green" /> Identity statement
          </div>
          <blockquote className="mt-5 max-w-3xl font-display text-2xl leading-tight text-foreground sm:text-3xl">
            “Veronica 7 transforma tecnologias avançadas em conhecimento prático, responsável e
            capaz de ampliar a autonomia humana.”
          </blockquote>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Educadora, criadora e estrategista. Não substitui pensamento, autoria ou julgamento:
            oferece clareza, método e ferramentas para que cada pessoa construa algo real.
          </p>
        </div>

        <div className="rounded-sm border border-border/50 bg-background/60 p-5">
          <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">
            <ShieldCheck className="h-4 w-4 text-neon-cyan" /> Canon contract
          </div>
          <dl className="mt-5 space-y-4 text-xs">
            <div>
              <dt className="font-mono-tech text-[9px] tracking-widest text-muted-foreground uppercase">
                Archetype
              </dt>
              <dd className="mt-1 text-foreground">Sábia · Exploradora · Criadora</dd>
            </div>
            <div>
              <dt className="font-mono-tech text-[9px] tracking-widest text-muted-foreground uppercase">
                Brand promise
              </dt>
              <dd className="mt-1 text-foreground">Entender, aplicar e evoluir.</dd>
            </div>
            <div>
              <dt className="font-mono-tech text-[9px] tracking-widest text-muted-foreground uppercase">
                Primary boundary
              </dt>
              <dd className="mt-1 text-foreground">Nunca prometer resultado sem evidência.</dd>
            </div>
            <div>
              <dt className="font-mono-tech text-[9px] tracking-widest text-muted-foreground uppercase">
                Owner
              </dt>
              <dd className="mt-1 text-foreground">Veronica Brand Intelligence</dd>
            </div>
          </dl>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-neon-cyan" />
          <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">
            Audience protocols
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {AUDIENCE_PROTOCOLS.map((protocol) => (
            <article
              key={protocol.id}
              className="rounded-sm border border-border/40 bg-surface/20 p-4"
            >
              <span className="font-mono-tech text-[9px] tracking-widest text-neon-green">
                {protocol.id}
              </span>
              <h3 className="mt-2 font-display text-lg text-foreground">{protocol.title}</h3>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {protocol.intent}
              </p>
              <div className="mt-4 border-t border-border/30 pt-3 text-[11px] leading-relaxed">
                <strong className="font-mono-tech text-[9px] tracking-wider text-foreground uppercase">
                  Tom
                </strong>
                <p className="mt-1 text-muted-foreground">{protocol.tone}</p>
              </div>
              <div className="mt-3 text-[11px] leading-relaxed">
                <strong className="font-mono-tech text-[9px] tracking-wider text-foreground uppercase">
                  Entrega
                </strong>
                <p className="mt-1 text-muted-foreground">{protocol.outcome}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-sm border border-border/50 bg-surface/20 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-neon-green" />
              <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">
                Canonical directives
              </h2>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {rules.length} de {CANON_RULES.length} diretivas visíveis
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <span className="sr-only">Buscar diretiva</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar no cânone…"
                className="h-10 w-full rounded-sm border border-border/60 bg-background pl-9 pr-3 text-xs text-foreground outline-none transition placeholder:text-muted-foreground focus:border-neon-green/60"
              />
            </label>
            <label>
              <span className="sr-only">Filtrar por público</span>
              <select
                value={audience}
                onChange={(event) => setAudience(event.target.value as Audience)}
                className="h-10 rounded-sm border border-border/60 bg-background px-3 font-mono-tech text-[10px] text-foreground outline-none focus:border-neon-green/60"
              >
                {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((item) => (
                  <option key={item} value={item}>
                    {AUDIENCE_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {rules.map((rule) => (
            <article
              key={rule.id}
              className="rounded-sm border border-border/40 bg-background/55 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono-tech text-[9px] tracking-widest text-neon-cyan">
                    {rule.id}
                  </span>
                  <h3 className="mt-1 font-display text-lg text-foreground">{rule.title}</h3>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono-tech text-[8px] tracking-widest ${priorityClass[rule.priority]}`}
                >
                  {rule.priority}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-foreground/85">{rule.directive}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {rule.rationale}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {rule.audiences.map((item) => (
                  <span
                    key={item}
                    className="rounded-sm border border-border/40 px-1.5 py-0.5 font-mono-tech text-[8px] text-muted-foreground"
                  >
                    {AUDIENCE_LABELS[item].toUpperCase()}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        {rules.length === 0 && (
          <div className="mt-5 rounded-sm border border-dashed border-border/50 p-8 text-center text-xs text-muted-foreground">
            Nenhuma diretiva corresponde aos filtros selecionados.
          </div>
        )}
      </section>

      <section>
        <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">
          Behavior matrix
        </h2>
        <div className="mt-4 overflow-x-auto rounded-sm border border-border/50">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead className="bg-surface/40 font-mono-tech text-[9px] tracking-widest text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Contexto</th>
                <th className="px-4 py-3">Aprovado</th>
                <th className="px-4 py-3">Rejeitado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {BEHAVIOR_MATRIX.map((item) => (
                <tr key={item.context} className="bg-background/40">
                  <th className="px-4 py-4 font-display text-sm font-medium text-foreground">
                    {item.context}
                  </th>
                  <td className="px-4 py-4 text-muted-foreground">
                    <span className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-green" />
                      {item.approved}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    <span className="flex items-start gap-2">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      {item.rejected}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="border-t border-border/40 pt-4 font-mono-tech text-[9px] tracking-wider text-muted-foreground uppercase">
        Canonical source · Phase 2A foundation · Editable persistence scheduled for the next
        controlled migration
      </div>
    </div>
  );
}
