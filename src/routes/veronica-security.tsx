import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Github,
  KeyRound,
  Unlock,
  Users,
  FolderOpen,
  MessageCircle,
  ArrowRight,
  Check,
  X,
  GraduationCap,
} from "lucide-react";
import { SiteHeader, SiteFooter, SOCIAL_LINKS } from "@/components/SiteChrome";
import { courses } from "@/lib/courses";

export const Route = createFileRoute("/veronica-security")({
  component: VeronicaSecurity,
  head: () => ({
    meta: [
      { title: "Veronica Security — Triagem gratuita de segurança | Veronica Hub" },
      {
        name: "description",
        content: "Checklist gratuito pra descobrir riscos reais de segurança no seu projeto, em linguagem simples. Diagnóstico completo feito por um desenvolvedor humano, sob demanda.",
      },
      { property: "og:title", content: "Veronica Security — Triagem gratuita de segurança" },
      { property: "og:description", content: "Sem varredura automática. Você responde, a gente te mostra o que isso significa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type RiskCategory = "repo" | "senha" | "painel" | "acesso" | "diretorio";

type ChecklistItem = {
  id: string;
  category: RiskCategory;
  text: string;
  // Normalmente "Sim" indica risco. Quando invertido, "Não" indica risco
  // (ex.: "você sabe quem tem acesso?" — aqui "sim" é a resposta segura).
  invert?: boolean;
};

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "repo-publico",
    category: "repo",
    text: "Seu repositório de código está público no GitHub, mesmo contendo informações sensíveis (senhas, chaves, dados de cliente)?",
  },
  {
    id: "senha-reutilizada",
    category: "senha",
    text: "Você usa a mesma senha em mais de um serviço (banco de dados, hospedagem, e-mail)?",
  },
  {
    id: "painel-sem-2fa",
    category: "painel",
    text: "Seu painel de administração é acessível por qualquer pessoa que descubra a URL, sem autenticação extra (2FA, IP fixo etc.)?",
  },
  {
    id: "acesso-conhecido",
    category: "acesso",
    text: "Você sabe, com certeza, quem tem acesso ao backend e ao domínio do seu projeto hoje?",
    invert: true,
  },
  {
    id: "env-commitado",
    category: "repo",
    text: "Arquivos de configuração (.env, chaves de API, tokens) já foram commitados no repositório em algum momento, mesmo removidos depois?",
  },
  {
    id: "diretorio-aberto",
    category: "diretorio",
    text: "Seu servidor ou hospedagem permite listar arquivos e pastas direto pela URL, sem bloqueio (diretório aberto)?",
  },
  {
    id: "senha-antiga",
    category: "senha",
    text: "Faz mais de 6 meses desde a última vez que você trocou as senhas de acesso ao backend, domínio ou banco de dados?",
  },
  {
    id: "ex-colaborador",
    category: "acesso",
    text: "Alguém que já trabalhou no projeto (ex-sócio, ex-freelancer) ainda pode ter acesso ativo a alguma dessas contas?",
  },
];

const CATEGORY_META: Record<RiskCategory, { icon: typeof Github; title: string; body: string }> = {
  repo: {
    icon: Github,
    title: "Repositório exposto",
    body: "Se o código ou o histórico de commits tem senha, chave de API ou dado sensível, qualquer pessoa com o link pode encontrar isso — mesmo que você apague depois, ficou no histórico.",
  },
  senha: {
    icon: KeyRound,
    title: "Senha fraca ou reutilizada",
    body: "Se uma senha vaza em um serviço, todos os outros que usam a mesma senha caem junto — é a forma mais comum de invasão hoje, mais que qualquer ataque sofisticado.",
  },
  painel: {
    icon: Unlock,
    title: "Painel sem autenticação extra",
    body: "Se basta saber o endereço pra entrar, um scanner automático encontra isso em minutos — não é preciso ser um hacker experiente pra achar a porta.",
  },
  acesso: {
    icon: Users,
    title: "Sem controle claro de acesso",
    body: "Se você não sabe (ou não revisa) quem ainda tem chave pro backend e pro domínio, não dá pra garantir que só gente de confiança consegue entrar hoje.",
  },
  diretorio: {
    icon: FolderOpen,
    title: "Diretório ou arquivo exposto",
    body: "Pastas que listam arquivo por arquivo, ou configurações acessíveis direto pela URL, entregam de bandeja o que deveria ficar só no seu servidor.",
  },
};

type RiskTier = "baixo" | "medio" | "alto";

const TIER_META: Record<RiskTier, { label: string; icon: typeof ShieldCheck; color: string; summary: string }> = {
  baixo: {
    label: "Risco Baixo",
    icon: ShieldCheck,
    color: "var(--neon-green)",
    summary: "Suas respostas não indicam falhas óbvias. Isso não é uma garantia de segurança total, mas é um bom sinal.",
  },
  medio: {
    label: "Risco Médio",
    icon: ShieldAlert,
    color: "oklch(0.78 0.17 80)",
    summary: "Você tem pontos reais de atenção. Nenhum é raro — mas juntos, facilitam bastante a vida de quem quiser invadir.",
  },
  alto: {
    label: "Risco Alto",
    icon: ShieldX,
    color: "var(--destructive)",
    summary: "Várias portas destrancadas ao mesmo tempo. São vulnerabilidades comuns, reais, e vale corrigir antes que alguém encontre primeiro.",
  },
};

function tierFor(score: number): RiskTier {
  if (score <= 1) return "baixo";
  if (score <= 4) return "medio";
  return "alto";
}

function isRisk(item: ChecklistItem, answer: boolean | null): boolean {
  if (answer === null) return false;
  return item.invert ? answer === false : answer === true;
}

const HACKING_ETICO = courses.find((c) => c.title === "Hacking Ético");

const RAIO_X_MESSAGE = "Olá! Quero contratar o Raio-X Veronica Security (R$9,90) para o site: ";
const raioXWhatsappUrl = `${SOCIAL_LINKS.whatsapp}?text=${encodeURIComponent(RAIO_X_MESSAGE)}`;

function VeronicaSecurity() {
  const [answers, setAnswers] = useState<Record<string, boolean | null>>(
    () => Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i.id, null])),
  );
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = CHECKLIST_ITEMS.every((i) => answers[i.id] !== null);
  const score = CHECKLIST_ITEMS.reduce((acc, i) => acc + (isRisk(i, answers[i.id]) ? 1 : 0), 0);
  const tier = tierFor(score);
  const flaggedCategories = Array.from(
    new Set(CHECKLIST_ITEMS.filter((i) => isRisk(i, answers[i.id])).map((i) => i.category)),
  );

  function setAnswer(id: string, value: boolean) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setSubmitted(false);
  }

  const TierIcon = TIER_META[tier].icon;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      {/* Hero — direto ao ponto, um único CTA */}
      <section className="relative overflow-hidden border-b border-border/40 py-16 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(circle at 20% 10%, oklch(0.85 0.22 155 / 0.18), transparent 55%)" }}
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-neon-green/40 bg-background/60 px-4 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" />
            Veronica Security · Diagnóstico manual
          </div>
          <h1 className="mx-auto mt-6 max-w-2xl font-display text-4xl sm:text-5xl md:text-6xl" style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}>
            Seu projeto está mais <span className="text-neon-green text-glow-green">exposto</span> do que parece.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-[1.65] text-muted-foreground">
            Um checklist rápido e gratuito, em linguagem simples, pra saber onde estão os riscos reais.
            Sem varredura automática — só o que você mesmo sabe sobre o seu projeto.
          </p>
          <a
            href="#triagem"
            className="group relative mt-8 inline-flex items-center gap-3 overflow-hidden rounded-sm bg-neon-green px-7 py-4 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            Fazer a triagem grátis <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
          <p className="mt-3 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Leva 2 minutos · 8 perguntas
          </p>
        </div>
      </section>

      {/* Etapa 1 — Checklist */}
      <section id="triagem" className="border-b border-border/40 bg-surface/40 py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-3 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
            <span className="h-px w-8 bg-neon-cyan" />
            [ 01 ] Triagem gratuita
          </div>
          <h2 className="font-display text-3xl sm:text-4xl" style={{ letterSpacing: "-0.03em", lineHeight: "1" }}>
            Responda com sinceridade.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-[1.6] text-muted-foreground">
            Isso não acessa, testa ou varre nada do seu projeto — é só o que você mesmo responde sobre suas
            próprias práticas.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {CHECKLIST_ITEMS.map((item) => {
              const answer = answers[item.id];
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-sm border border-border/60 bg-background/60 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <p className="text-[14.5px] leading-[1.55] text-foreground/90">{item.text}</p>
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setAnswer(item.id, true)}
                      className={`flex items-center gap-1.5 rounded-full border px-4 py-2 font-mono-tech text-[10.5px] uppercase tracking-widest transition ${
                        answer === true
                          ? "border-neon-green bg-neon-green/15 text-neon-green"
                          : "border-border/60 text-muted-foreground hover:border-neon-green/40 hover:text-foreground"
                      }`}
                    >
                      <Check className="h-3 w-3" /> Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnswer(item.id, false)}
                      className={`flex items-center gap-1.5 rounded-full border px-4 py-2 font-mono-tech text-[10.5px] uppercase tracking-widest transition ${
                        answer === false
                          ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                          : "border-border/60 text-muted-foreground hover:border-neon-cyan/40 hover:text-foreground"
                      }`}
                    >
                      <X className="h-3 w-3" /> Não
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
            className="group relative mt-8 inline-flex items-center gap-2 overflow-hidden rounded-sm bg-neon-green px-7 py-3.5 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ver meu resultado <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
          {!allAnswered && (
            <p className="mt-3 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground/70">
              Responda todas as {CHECKLIST_ITEMS.length} perguntas pra ver o resultado.
            </p>
          )}
        </div>
      </section>

      {/* Resultado da triagem */}
      {submitted && allAnswered && (
        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex flex-col items-start gap-6 rounded-sm border p-6 backdrop-blur sm:p-8" style={{ borderColor: `color-mix(in oklab, ${TIER_META[tier].color} 45%, var(--border))`, background: "var(--surface)" }}>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-sm border" style={{ borderColor: TIER_META[tier].color, color: TIER_META[tier].color }}>
                  <TierIcon className="h-7 w-7" />
                </div>
                <div>
                  <div className="font-display text-2xl text-foreground" style={{ letterSpacing: "-0.02em" }}>
                    {TIER_META[tier].label}
                  </div>
                  <div className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                    {score} de {CHECKLIST_ITEMS.length} respostas indicam atenção
                  </div>
                </div>
              </div>
              <p className="text-[15px] leading-[1.65] text-foreground/90">{TIER_META[tier].summary}</p>

              {flaggedCategories.length > 0 && (
                <div className="w-full">
                  <div className="mb-4 font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                    O que isso pode significar
                  </div>
                  <div className="flex flex-col gap-3">
                    {flaggedCategories.map((cat) => {
                      const meta = CATEGORY_META[cat];
                      const CatIcon = meta.icon;
                      return (
                        <div key={cat} className="flex items-start gap-3 rounded-sm border border-border/60 bg-background/60 p-4">
                          <CatIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-neon-cyan" />
                          <div>
                            <div className="text-[14px] text-foreground">{meta.title}</div>
                            <p className="mt-1 text-[13px] leading-[1.55] text-muted-foreground">{meta.body}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Etapa 2 — Raio-X profissional */}
      <section className="border-b border-border/40 bg-surface/40 py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-3 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />
            [ 02 ] Raio-X profissional
          </div>
          <h2 className="font-display text-3xl sm:text-4xl" style={{ letterSpacing: "-0.03em", lineHeight: "1" }}>
            Quer o diagnóstico completo, feito por um especialista?
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-[1.6] text-muted-foreground">
            A triagem acima é uma autoavaliação. O Raio-X vai além: um desenvolvedor humano — o próprio
            administrador da Veronica Hub — analisa seu projeto manualmente e entrega um documento oficial,
            pronto pra protocolar ou arquivar.
          </p>

          <div className="mt-8 flex flex-col gap-4 rounded-sm border border-neon-green/30 bg-gradient-to-br from-neon-green/8 via-background/60 to-background p-6 backdrop-blur sm:p-8">
            <div className="flex flex-wrap items-end gap-2">
              <span className="font-display text-5xl text-neon-green text-glow-green">R$9,90</span>
              <span className="mb-1.5 font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground">
                pagamento único · via Pix
              </span>
            </div>
            <ul className="flex flex-col gap-2.5">
              {[
                "Análise manual, feita por um desenvolvedor — não é varredura automática",
                "Entrega em até 24h após a confirmação do pagamento",
                "Documento profissional, pronto pra protocolar ou arquivar",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-foreground/90">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-neon-green" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={raioXWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative mt-2 inline-flex w-fit items-center gap-2 overflow-hidden rounded-sm bg-neon-green px-6 py-3.5 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
            >
              <MessageCircle className="h-4 w-4" />
              Chamar no WhatsApp
            </a>
            <p className="text-[12px] leading-[1.5] text-muted-foreground">
              O pagamento (Pix) é combinado direto no WhatsApp — nada é cobrado automaticamente aqui.
            </p>
          </div>
        </div>
      </section>

      {/* Indução — Hacking Ético */}
      {HACKING_ETICO && (
        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="mb-3 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
              <span className="h-px w-8 bg-neon-cyan" />
              [ 03 ] Vá além
            </div>
            <h2 className="font-display text-3xl sm:text-4xl" style={{ letterSpacing: "-0.03em", lineHeight: "1" }}>
              Quer entender esses riscos por dentro, não só de fora?
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-[1.6] text-muted-foreground">
              O comando <strong className="text-foreground">Hacking Ético</strong> te ensina exatamente isso —
              pentesting real, bug bounty e laboratório dedicado pra você mesmo achar as falhas antes de alguém achar por você.
            </p>
            <Link
              to="/comandos"
              hash="hacking-etico"
              className="group relative mt-8 flex items-center justify-between gap-6 overflow-hidden rounded-sm border border-border/60 bg-surface/70 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-neon-cyan/60 hover:shadow-[0_0_30px_-8px_oklch(0.88_0.15_195/0.5)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-sm border border-neon-cyan/40 text-neon-cyan">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-foreground" style={{ letterSpacing: "-0.02em" }}>
                    {HACKING_ETICO.title}
                  </h3>
                  <div className="mt-1 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                    {HACKING_ETICO.lessons} aulas · {HACKING_ETICO.hours} · {HACKING_ETICO.level}
                  </div>
                </div>
              </div>
              <span className="flex flex-shrink-0 items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition group-hover:text-neon-cyan">
                Ver comando <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
