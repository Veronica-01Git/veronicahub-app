/**
 * /agentes — Agentes de IA guiados pela Veronica, desenvolvidos pela
 * Yo Lab & co.
 *
 * DUAS DECISÕES DE PRODUTO QUE EXPLICAM O DESENHO DESTA PÁGINA.
 *
 * 1. O ONBOARDING NÃO TEM FORMULÁRIO. O caminho padrão do mercado é pedir
 *    trinta campos antes de mostrar qualquer coisa, e é por isso que quase
 *    ninguém termina. Aqui o dono grava um áudio falando como falaria com um
 *    funcionário novo, ou cola a conversa que já está no celular dele. O
 *    modelo extrai; ele confere o que saiu.
 *
 * 2. A PROVA VEM ANTES DO PAGAMENTO. A Veronica vira cliente e conversa com
 *    a agente recém-alimentada, na frente dele. E a guarda de preço roda na
 *    simulação igual roda em produção: o que ele vê é o que ele leva.
 *
 * Preço nenhum é escrito aqui. Tudo vem de src/lib/agentes.ts, com
 * procedência — e valor ainda não confirmado pelo dono aparece marcado na
 * tela, em vez de passar por definitivo.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Mic,
  Square,
  ClipboardPaste,
  Keyboard,
  Play,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
  AlertTriangle,
  Clock,
  Wand2,
  MessageCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { SiteHeader, SiteFooter, PageHero } from "@/components/SiteChrome";
import {
  AGENTES,
  PACOTES_DE_SALDO,
  agente,
  formatarBRL,
  formatarHoras,
  precoConfirmado,
  restanteDoTeste,
  type AgenteId,
} from "@/lib/agentes";
import {
  meusAgentes,
  iniciarTeste,
  enviarBriefing,
  transcreverBriefing,
  simularLead,
  contratarPlano,
  recomendarOferta,
  gerarKitCriativo,
  type BriefingExtraido,
  type EstadoAgente,
  type KitCriativo,
  type OfertaRecomendada,
  type RodadaSimulacao,
} from "@/lib/agentes-server";
import { getWallet, createDeposit } from "@/lib/wallet-server";
import { affiliateProducts, hasAffiliateProducts } from "@/lib/affiliate-products";

export const Route = createFileRoute("/agentes")({
  component: Agentes,
  head: () => ({
    meta: [
      { title: "Agentes de IA — guiados pela Veronica | Veronica Hub" },
      {
        name: "description",
        content:
          "Agentes de IA que atendem, vendem e não inventam. Teste 6 horas de graça: grave um áudio, a agente aprende o seu negócio e a Veronica testa ela na sua frente antes de você pagar.",
      },
      { property: "og:title", content: "Agentes de IA — guiados pela Veronica" },
      {
        property: "og:description",
        content:
          "Alimente sua agente falando. Veja a Veronica testar ela como cliente. Só depois pague.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/* ------------------------------------------------------------ primitivos */

function Secao({
  id,
  numero,
  titulo,
  children,
}: {
  id: string;
  numero: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border/40 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-baseline gap-4">
          <span className="font-mono-tech text-xs text-neon-green">[{numero}]</span>
          <h2 className="font-display text-3xl md:text-4xl" style={{ letterSpacing: "-0.03em" }}>
            {titulo}
          </h2>
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function Aviso({
  children,
  tom = "atencao",
}: {
  children: React.ReactNode;
  tom?: "atencao" | "erro";
}) {
  return (
    <p
      className={`flex items-start gap-2 rounded-sm border px-3 py-2 text-xs leading-relaxed ${
        tom === "erro"
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400"
      }`}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function Botao({
  children,
  onClick,
  disabled,
  carregando,
  variante = "primario",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  carregando?: boolean;
  variante?: "primario" | "secundario";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || carregando}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        variante === "primario"
          ? "bg-neon-green text-background hover:opacity-90"
          : "border border-border/60 hover:border-neon-green/60"
      }`}
    >
      {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/**
 * Preço com a procedência à vista. Valor ainda não confirmado pelo dono
 * aparece com um asterisco e um título explicativo — não vira número
 * definitivo só porque está bonito na tela.
 */
function Preco({ cents, confirmado }: { cents: number; confirmado: boolean }) {
  return (
    <span className="font-display text-3xl">
      {formatarBRL(cents)}
      {!confirmado && (
        <sup
          className="ml-1 cursor-help font-mono-tech text-[10px] text-amber-500"
          title="Preço proposto, ainda não confirmado pelo dono do negócio. Ver src/lib/agentes.ts"
        >
          a confirmar
        </sup>
      )}
    </span>
  );
}

/* ------------------------------------------------------ gravador de áudio */

type EstadoGravacao = "parado" | "gravando" | "processando";

/**
 * Gravação pelo MediaRecorder do próprio navegador — sem biblioteca e sem
 * upload de arquivo. O áudio vira base64 e sobe direto para a transcrição;
 * nada é guardado em disco de nenhum dos lados (ver transcreverBriefing).
 */
function useGravador(aoTranscrever: (base64: string, mimeType: string) => void) {
  const [estado, setEstado] = useState<EstadoGravacao>("parado");
  const [erro, setErro] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const pedacosRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (estado !== "gravando") return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [estado]);

  const comecar = useCallback(async () => {
    setErro(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErro("Seu navegador não permite gravar aqui. Cole a conversa ou escreva.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      pedacosRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) pedacosRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setEstado("processando");
        const blob = new Blob(pedacosRef.current, { type: recorder.mimeType });
        const buffer = await blob.arrayBuffer();
        // btoa em pedaços: String.fromCharCode(...bytes) estoura a pilha
        // em áudio de alguns minutos.
        const bytes = new Uint8Array(buffer);
        let binario = "";
        for (let i = 0; i < bytes.length; i += 8192) {
          binario += String.fromCharCode(...bytes.subarray(i, i + 8192));
        }
        aoTranscrever(btoa(binario), recorder.mimeType || "audio/webm");
        setEstado("parado");
        setSegundos(0);
      };
      recorder.start();
      recorderRef.current = recorder;
      setSegundos(0);
      setEstado("gravando");
    } catch {
      setErro("Não consegui acessar o microfone. Cole a conversa ou escreva.");
    }
  }, [aoTranscrever]);

  const parar = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }, []);

  return { estado, erro, segundos, comecar, parar };
}

/* ------------------------------------------------------------- perguntas */

/**
 * O que a Veronica pergunta no áudio. Seis perguntas, na ordem em que um
 * dono responderia sem pensar — não é formulário, é pauta de conversa.
 *
 * O VÍDEO DELA. Cada pergunta tem um arquivo de vídeo esperado em /videos/.
 * Enquanto o arquivo não existir, a página mostra a pergunta escrita e segue
 * funcionando — mesma estratégia do StepVideo em VeronicaDrawer.tsx.
 */

/**
 * Os vídeos da Veronica já foram produzidos e publicados em /videos/?
 *
 * POR QUE UMA FLAG, E NÃO SÓ O onError DO <video>. O onError só dispara
 * quando o arquivo responde 404. Este app é uma SPA servida por Worker: um
 * caminho que não existe devolve o HTML da página, com status 200. O
 * navegador então recebe "um vídeo" que não é vídeo, não chama onError, e a
 * tela fica com um player cinza vazio e controles que não fazem nada — que
 * foi exatamente o que apareceu no print de 20/09.
 *
 * Com a flag desligada o <video> nem chega a ser montado: aparece a pergunta
 * escrita, que é a experiência honesta enquanto os vídeos não existem. Ao
 * publicar os seis arquivos, troque para true — o onError continua aí como
 * rede de segurança para o caso de um arquivo faltar depois.
 */
const VIDEOS_DA_VERONICA_PUBLICADOS = false;
const PERGUNTAS_DA_VERONICA: { id: string; pergunta: string; video: string }[] = [
  { id: "oque", pergunta: "O que a sua empresa vende, em uma frase?", video: "agente-p1.mp4" },
  {
    id: "preco",
    pergunta: "Me fala os preços que você mais repete no dia a dia.",
    video: "agente-p2.mp4",
  },
  { id: "onde", pergunta: "Você atende quais cidades ou regiões?", video: "agente-p3.mp4" },
  {
    id: "pergunta",
    pergunta: "O que você SEMPRE pergunta antes de passar um valor?",
    video: "agente-p4.mp4",
  },
  { id: "nunca", pergunta: "O que ninguém além de você pode responder?", video: "agente-p5.mp4" },
  {
    id: "jeito",
    pergunta: "Responde aí como se eu fosse um cliente perguntando preço.",
    video: "agente-p6.mp4",
  },
];

function VideoDaVeronica({ arquivo, pergunta }: { arquivo: string; pergunta: string }) {
  const [falhou, setFalhou] = useState(false);
  if (!VIDEOS_DA_VERONICA_PUBLICADOS || falhou) {
    // A pergunta já aparece escrita logo abaixo deste bloco — repeti-la aqui
    // dentro seria dizer duas vezes a mesma coisa na mesma tela. O cartão só
    // guarda o lugar e diz de quem é a fala.
    return (
      <div
        className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-sm border border-neon-green/25 bg-neon-green/[0.04] p-4 text-center"
        aria-label={`Vídeo da Veronica perguntando: ${pergunta}`}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-neon-green/40">
          <Play className="ml-0.5 h-4 w-4 text-neon-green" />
        </span>
        <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
          a Veronica pergunta, você responde falando
        </span>
        <span className="font-mono-tech text-[10px] text-muted-foreground/50">
          vídeo em produção · a pergunta está logo abaixo
        </span>
      </div>
    );
  }
  return (
    <video
      key={arquivo}
      controls
      playsInline
      preload="none"
      className="aspect-video w-full rounded-sm border border-border/40 object-cover"
      onError={() => setFalhou(true)}
    >
      <source src={`/videos/${arquivo}`} type="video/mp4" />
    </video>
  );
}

/* ------------------------------------------------------------- a página */

function Agentes() {
  const [estados, setEstados] = useState<EstadoAgente[] | null>(null);
  const [saldoCents, setSaldoCents] = useState<number | null>(null);
  const [logado, setLogado] = useState<boolean | null>(null);

  const recarregar = useCallback(async () => {
    const [ags, carteira] = await Promise.all([meusAgentes(), getWallet()]);
    setEstados(ags);
    setLogado(ags !== null);
    setSaldoCents(carteira?.balanceCents ?? null);
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const estadoDe = useCallback(
    (id: AgenteId) => estados?.find((e) => e.agenteId === id) ?? null,
    [estados],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <PageHero
        eyebrow="Yo Lab & co. · guiados pela Veronica"
        title={
          <>
            Agentes que atendem.
            <br />E que não inventam.
          </>
        }
        subtitle="Escolha o agente que resolve o seu problema, alimente ele falando — sem formulário — e veja a Veronica testar ele como se fosse seu cliente. Só depois disso você paga."
      >
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="#whatsapp"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-neon-green px-5 text-sm font-medium text-background"
          >
            Testar 6 horas grátis <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#analytics"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border/60 px-5 text-sm"
          >
            Ganhar com afiliados
          </a>
        </div>
        {saldoCents !== null && (
          <p className="mt-6 font-mono-tech text-xs text-muted-foreground">
            saldo na carteira: {formatarBRL(saldoCents)}
          </p>
        )}
      </PageHero>

      {/* ------------------------------------------------ [01] vitrine */}
      <Secao id="vitrine" numero="01" titulo="Os agentes">
        <div className="grid gap-6 md:grid-cols-2">
          {AGENTES.map((a) => {
            const estado = estadoDe(a.id);
            return (
              <article
                key={a.id}
                className="flex flex-col rounded-sm border border-border/60 p-6 transition hover:border-neon-green/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-2xl">{a.nome}</h3>
                  {a.testeHoras > 0 && (
                    <span className="shrink-0 rounded-full border border-neon-green/40 px-3 py-1 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">
                      {formatarHoras(a.testeHoras)} grátis
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-neon-green">{a.tagline}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{a.promessa}</p>

                <ul className="mt-5 space-y-2">
                  {a.entregas.map((e) => (
                    <li key={e} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-neon-green" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-2 border-t border-border/40 pt-4">
                  {a.pendencias.map((p) => (
                    <p key={p} className="text-xs leading-relaxed text-muted-foreground">
                      · {p}
                    </p>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  {estado?.liberado ? (
                    <span className="inline-flex items-center gap-1.5 font-mono-tech text-xs text-neon-green">
                      <Clock className="h-3.5 w-3.5" />
                      {estado.expiraEm ? restanteDoTeste(estado.expiraEm) : "liberado"}
                    </span>
                  ) : (
                    <span className="font-mono-tech text-xs text-muted-foreground">
                      a partir de {formatarBRL(a.planos[0].precoCents)} / {a.planos[0].unidade}
                    </span>
                  )}
                  <a
                    href={`#${a.ancora}`}
                    className="inline-flex items-center gap-1 text-sm text-neon-green hover:underline"
                  >
                    abrir <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        {logado === false && (
          <p className="mt-8 text-sm text-muted-foreground">
            Entre com seu e-mail pelo topo da página para começar o teste — os créditos e o teste
            grátis ficam ligados à conta, não ao navegador.
          </p>
        )}
      </Secao>

      {/* --------------------------------------------- [02] WhatsApp */}
      <AgenteWhatsApp
        estado={estadoDe("whatsapp-empresarial")}
        aoMudar={recarregar}
        logado={logado}
      />

      {/* -------------------------------------------- [03] Analytics */}
      <AgenteAnalytics estado={estadoDe("analytics-afiliado")} aoMudar={recarregar} />

      {/* ------------------------------------------- [04] carteira */}
      <Secao id="creditos" numero="04" titulo="Créditos">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* min-w-0: item de grid nasce com min-width:auto, então ele estica
              para caber o conteúdo em vez de deixar o filho rolar. Sem isto, a
              tabela de min-w-[520px] abaixo empurra a PÁGINA INTEIRA para
              544px no celular, em vez de rolar dentro do próprio overflow-x-auto. */}
          <div className="min-w-0">
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Um crédito é saldo em reais na mesma carteira que o Studio e o Currículo-Certo já usam
              — não é uma segunda moeda com câmbio próprio. Você põe saldo, usa avulso quando quiser
              provar, e contrata o plano quando o volume justificar.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="py-2">Agente</th>
                    <th className="py-2">Avulso</th>
                    <th className="py-2">Mensal</th>
                    <th className="py-2">Anual</th>
                  </tr>
                </thead>
                <tbody>
                  {AGENTES.map((a) => (
                    <tr key={a.id} className="border-b border-border/20">
                      <td className="py-3 pr-4">{a.nome}</td>
                      {a.planos.map((p) => (
                        <td key={p.id} className="py-3 pr-4">
                          <span className="whitespace-nowrap">
                            {formatarBRL(p.precoCents)}
                            {!precoConfirmado(p.procedencia) && (
                              <sup className="ml-0.5 font-mono-tech text-[9px] text-amber-500">
                                *
                              </sup>
                            )}
                          </span>
                          <span className="block text-xs text-muted-foreground">{p.unidade}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              <span className="text-amber-500">*</span> preço proposto, ainda sem confirmação do
              dono do negócio. Mesma regra de procedência do agente da Express Entulho: valor sem
              fonte fica marcado até alguém confirmar.
            </p>
          </div>

          <Recarga saldoCents={saldoCents} aoRecarregar={recarregar} />
        </div>
      </Secao>

      <SiteFooter />
    </div>
  );
}

/* --------------------------------------------------------- recarga */

function Recarga({
  saldoCents,
  aoRecarregar,
}: {
  saldoCents: number | null;
  aoRecarregar: () => Promise<void>;
}) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function depositar(valorCents: number) {
    setErro(null);
    setCarregando(true);
    try {
      const res = await createDeposit({ data: { amountCents: valorCents } });
      if (res.ok) {
        window.location.href = res.checkoutUrl;
        return;
      }
      setErro(res.error);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao iniciar o pagamento.");
    } finally {
      setCarregando(false);
      void aoRecarregar();
    }
  }

  return (
    <aside className="h-fit rounded-sm border border-border/60 p-6">
      <p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
        sua carteira
      </p>
      <p className="mt-2 font-display text-3xl">
        {saldoCents === null ? "—" : formatarBRL(saldoCents)}
      </p>
      <div className="mt-6 space-y-2">
        {PACOTES_DE_SALDO.map((p) => (
          <button
            key={p.rotulo}
            type="button"
            onClick={() => depositar(p.valorCents)}
            disabled={carregando}
            className="flex w-full min-h-11 items-center justify-between rounded-sm border border-border/60 px-4 text-sm transition hover:border-neon-green/60 disabled:opacity-50"
          >
            <span>{p.rotulo}</span>
            <span className="font-mono-tech">{formatarBRL(p.valorCents)}</span>
          </button>
        ))}
      </div>
      {erro && (
        <div className="mt-4">
          <Aviso tom="erro">{erro}</Aviso>
        </div>
      )}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Pagamento pelo Mercado Pago. O saldo entra quando o pagamento confirma, não na hora do
        clique.
      </p>
    </aside>
  );
}

/* ------------------------------------------------- agente de WhatsApp */

type AbaBriefing = "audio" | "conversa" | "texto";

function AgenteWhatsApp({
  estado,
  aoMudar,
  logado,
}: {
  estado: EstadoAgente | null;
  aoMudar: () => Promise<void>;
  logado: boolean | null;
}) {
  const config = agente("whatsapp-empresarial");
  const [aba, setAba] = useState<AbaBriefing>("audio");
  const [rascunho, setRascunho] = useState("");
  const [extraido, setExtraido] = useState<BriefingExtraido | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [rodadas, setRodadas] = useState<RodadaSimulacao[]>([]);
  const [perguntaAtual, setPerguntaAtual] = useState(0);

  const liberado = estado?.liberado ?? false;

  const transcrever = useCallback(async (base64: string, mimeType: string) => {
    setErro(null);
    setOcupado("Transcrevendo o que você falou…");
    try {
      const res = await transcreverBriefing({
        data: { agenteId: "whatsapp-empresarial", audioBase64: base64, mimeType },
      });
      if (res.ok) {
        setRascunho((atual) => (atual ? `${atual}\n\n${res.texto}` : res.texto));
        setPerguntaAtual((p) => Math.min(p + 1, PERGUNTAS_DA_VERONICA.length - 1));
      } else {
        setErro(res.error);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao transcrever.");
    } finally {
      setOcupado(null);
    }
  }, []);

  const gravador = useGravador(transcrever);

  async function comecarTeste() {
    setErro(null);
    setOcupado("Abrindo seu teste…");
    try {
      const res = await iniciarTeste({ data: { agenteId: "whatsapp-empresarial" } });
      if (!res.ok) setErro(res.error);
      await aoMudar();
    } finally {
      setOcupado(null);
    }
  }

  async function ensinar() {
    if (rascunho.trim().length < 20) {
      setErro("Escreva, cole ou grave um pouco mais — preciso de material para extrair.");
      return;
    }
    setErro(null);
    setOcupado("Lendo o seu material…");
    try {
      const res = await enviarBriefing({
        data: {
          agenteId: "whatsapp-empresarial",
          fonte: aba === "audio" ? "audio" : aba === "conversa" ? "conversa" : "texto",
          conteudo: rascunho.trim(),
        },
      });
      if (res.ok) {
        setExtraido(res.extraido);
        setRodadas([]);
      } else {
        setErro(res.error);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao ensinar a agente.");
    } finally {
      setOcupado(null);
    }
  }

  async function proximaRodada() {
    setErro(null);
    setOcupado("A Veronica está digitando…");
    try {
      const res = await simularLead({
        data: { agenteId: "whatsapp-empresarial", historico: rodadas },
      });
      if (res.ok) setRodadas((r) => [...r, res.rodada]);
      else setErro(res.error);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha na simulação.");
    } finally {
      setOcupado(null);
    }
  }

  async function contratar(planoId: "mensal" | "anual") {
    setErro(null);
    setOcupado("Contratando…");
    try {
      const res = await contratarPlano({ data: { agenteId: "whatsapp-empresarial", planoId } });
      if (!res.ok) {
        setErro(
          res.error === "insufficient_funds"
            ? "Saldo insuficiente. Recarregue a carteira em [04] e volte aqui."
            : res.error,
        );
      }
      await aoMudar();
    } finally {
      setOcupado(null);
    }
  }

  const pergunta = PERGUNTAS_DA_VERONICA[perguntaAtual];

  return (
    <Secao id="whatsapp" numero="02" titulo={config.nome}>
      {/* Porta de entrada: o teste */}
      {!liberado && (
        <div className="mb-10 rounded-sm border border-neon-green/40 bg-neon-green/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-xl">
                {formatarHoras(config.testeHoras)} de teste, sem cartão
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                O relógio começa agora, no primeiro uso — não no cadastro.
                {estado?.testeJaUsado && " Seu teste já foi usado."}
              </p>
            </div>
            <Botao
              onClick={comecarTeste}
              disabled={logado === false || estado?.testeJaUsado}
              carregando={ocupado === "Abrindo seu teste…"}
            >
              {logado === false ? "Entre para testar" : "Começar o teste"}
            </Botao>
          </div>
        </div>
      )}

      {liberado && estado?.expiraEm && (
        <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-neon-green/40 px-4 py-1.5 font-mono-tech text-xs text-neon-green">
          <Clock className="h-3.5 w-3.5" />
          {restanteDoTeste(estado.expiraEm)}
        </p>
      )}

      {/* Passo 1 — alimentar */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl">
            <span className="font-mono-tech text-xs text-neon-green">1.</span>
            Ensine sua agente sem preencher nada
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Escolha o jeito mais rápido para você. Falar costuma ser o mais rápido de todos: a
            Veronica pergunta, você responde como responderia a um funcionário novo.
          </p>

          <div className="mt-6 flex gap-2">
            {(
              [
                { id: "audio" as const, rotulo: "Falar", icone: Mic },
                { id: "conversa" as const, rotulo: "Colar conversa", icone: ClipboardPaste },
                { id: "texto" as const, rotulo: "Escrever", icone: Keyboard },
              ] satisfies { id: AbaBriefing; rotulo: string; icone: typeof Mic }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setAba(t.id)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-sm border px-4 text-sm transition ${
                  aba === t.id
                    ? "border-neon-green bg-neon-green/10 text-neon-green"
                    : "border-border/60 hover:border-neon-green/50"
                }`}
              >
                <t.icone className="h-4 w-4" />
                {t.rotulo}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {aba === "audio" && (
              <div className="space-y-4">
                <VideoDaVeronica arquivo={pergunta.video} pergunta={pergunta.pergunta} />
                <p className="text-sm">
                  <span className="font-mono-tech text-xs text-neon-green">
                    {perguntaAtual + 1}/{PERGUNTAS_DA_VERONICA.length}
                  </span>{" "}
                  {pergunta.pergunta}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {gravador.estado === "gravando" ? (
                    <Botao onClick={gravador.parar} variante="secundario">
                      <Square className="h-4 w-4 fill-current" />
                      Parar ({gravador.segundos}s)
                    </Botao>
                  ) : (
                    <Botao
                      onClick={() => void gravador.comecar()}
                      disabled={!liberado}
                      carregando={gravador.estado === "processando"}
                    >
                      <Mic className="h-4 w-4" />
                      Responder falando
                    </Botao>
                  )}
                  {perguntaAtual < PERGUNTAS_DA_VERONICA.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setPerguntaAtual((p) => p + 1)}
                      className="text-sm text-muted-foreground hover:text-neon-green"
                    >
                      pular esta
                    </button>
                  )}
                </div>
                {gravador.erro && <Aviso>{gravador.erro}</Aviso>}
              </div>
            )}

            {aba === "conversa" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No WhatsApp: abra a conversa → menu → <em>Exportar conversa</em> → sem mídia. Cole
                  aqui. Pode ser só um trecho de um dia movimentado.
                </p>
                <textarea
                  value={rascunho}
                  onChange={(e) => setRascunho(e.target.value)}
                  disabled={!liberado}
                  rows={10}
                  placeholder="[14:02] Cliente: quanto fica a caçamba?&#10;[14:03] Você: é pra qual material?"
                  className="w-full rounded-sm border border-border/60 bg-background p-3 font-mono-tech text-xs leading-relaxed outline-none focus:border-neon-green/60 disabled:opacity-50"
                />
              </div>
            )}

            {aba === "texto" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Escreva do seu jeito. Não precisa ser organizado — a agente organiza.
                </p>
                <textarea
                  value={rascunho}
                  onChange={(e) => setRascunho(e.target.value)}
                  disabled={!liberado}
                  rows={10}
                  placeholder="Eu alugo caçamba em Itajaí. Demolição na menor é 220, gesso é 280…"
                  className="w-full rounded-sm border border-border/60 bg-background p-3 text-sm leading-relaxed outline-none focus:border-neon-green/60 disabled:opacity-50"
                />
              </div>
            )}
          </div>

          {aba === "audio" && rascunho && (
            <div className="mt-4 rounded-sm border border-border/40 bg-muted/20 p-3">
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                o que eu ouvi
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{rascunho}</p>
            </div>
          )}

          <div className="mt-6">
            <Botao
              onClick={ensinar}
              disabled={!liberado || rascunho.trim().length < 20}
              carregando={ocupado === "Lendo o seu material…"}
            >
              <Wand2 className="h-4 w-4" />
              Ensinar a agente
            </Botao>
          </div>
        </div>

        {/* Passo 2 — o que ela entendeu */}
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl">
            <span className="font-mono-tech text-xs text-neon-green">2.</span>
            Confira o que ela entendeu
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Isto aqui é palpite de modelo até você conferir. O que ela não achou vira lacuna — e
            lacuna nunca vira resposta inventada, vira encaminhamento.
          </p>

          {!extraido ? (
            <div className="mt-6 flex min-h-[220px] items-center justify-center rounded-sm border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              Alimente a agente ao lado e o que ela entendeu aparece aqui.
            </div>
          ) : (
            <div className="mt-6 space-y-5 rounded-sm border border-border/60 p-5">
              {extraido.negocio && (
                <div>
                  <p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                    negócio
                  </p>
                  <p className="mt-1 text-sm">{extraido.negocio}</p>
                </div>
              )}

              {extraido.precos.length > 0 && (
                <div>
                  <p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                    preços que ela pode citar
                  </p>
                  <ul className="mt-2 space-y-1">
                    {extraido.precos.map((p) => (
                      <li
                        key={`${p.item}-${p.valorReais}`}
                        className="flex justify-between text-sm"
                      >
                        <span>{p.item}</span>
                        <span className="font-mono-tech">
                          {formatarBRL(Math.round(p.valorReais * 100))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {extraido.cidades.length > 0 && (
                <div>
                  <p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                    cidades
                  </p>
                  <p className="mt-1 text-sm">{extraido.cidades.join(" · ")}</p>
                </div>
              )}

              {extraido.escalar.length > 0 && (
                <div>
                  <p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                    sempre chama você
                  </p>
                  <p className="mt-1 text-sm">{extraido.escalar.join(" · ")}</p>
                </div>
              )}

              {extraido.lacunas.length > 0 && (
                <div>
                  <p className="font-mono-tech text-[10px] uppercase tracking-widest text-amber-500">
                    o que falta ({extraido.lacunas.length})
                  </p>
                  <ul className="mt-2 space-y-1">
                    {extraido.lacunas.map((l) => (
                      <li key={l} className="text-sm text-muted-foreground">
                        · {l}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Passo 3 — a prova */}
      <div className="mt-16 rounded-sm border border-border/60 p-6 md:p-8">
        <h3 className="flex items-center gap-2 font-display text-xl">
          <span className="font-mono-tech text-xs text-neon-green">3.</span>A Veronica vira cliente
          e testa ela na sua frente
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Ela pergunta preço antes de dizer o que precisa, pede desconto e cita cidade que talvez
          você não atenda — o cliente que mais testa atendimento. A mesma guarda que roda em
          produção roda aqui: valor que não está no seu briefing não sai da boca da sua agente.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Botao
            onClick={proximaRodada}
            disabled={!liberado || !extraido}
            carregando={ocupado === "A Veronica está digitando…"}
          >
            <MessageCircle className="h-4 w-4" />
            {rodadas.length === 0 ? "Começar a simulação" : "Próxima mensagem"}
          </Botao>
          {rodadas.length > 0 && (
            <button
              type="button"
              onClick={() => setRodadas([])}
              className="text-sm text-muted-foreground hover:text-neon-green"
            >
              recomeçar
            </button>
          )}
          {!extraido && (
            <span className="text-sm text-muted-foreground">
              alimente a agente primeiro (passo 1)
            </span>
          )}
        </div>

        {rodadas.length > 0 && (
          <div className="mt-8 space-y-4">
            {rodadas.map((r, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-sm rounded-tl-none border border-border/60 bg-muted/30 px-4 py-2.5">
                    <p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                      Veronica, como cliente
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{r.lead}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div
                    className={`max-w-[80%] rounded-sm rounded-tr-none border px-4 py-2.5 ${
                      r.escalou
                        ? "border-amber-500/50 bg-amber-500/5"
                        : "border-neon-green/40 bg-neon-green/5"
                    }`}
                  >
                    <p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                      sua agente
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{r.agente}</p>
                    {r.escalou && (
                      <p className="mt-2 flex items-start gap-1.5 border-t border-amber-500/30 pt-2 font-mono-tech text-[10px] text-amber-600 dark:text-amber-400">
                        <ShieldCheck className="mt-px h-3 w-3 shrink-0" />
                        guarda: {r.motivo ?? "resposta encaminhada para humano"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {erro && (
        <div className="mt-6">
          <Aviso tom="erro">{erro}</Aviso>
        </div>
      )}

      {/* Passo 4 — planos */}
      <div className="mt-16">
        <h3 className="flex items-center gap-2 font-display text-xl">
          <span className="font-mono-tech text-xs text-neon-green">4.</span>
          Gostou do que viu? Aí sim.
        </h3>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {config.planos.map((p) => (
            <div
              key={p.id}
              className={`rounded-sm border p-5 ${
                p.id === "mensal" ? "border-neon-green/50" : "border-border/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                  {p.rotulo}
                </p>
                {p.economia && (
                  <span className="rounded-full bg-neon-green/10 px-2 py-0.5 font-mono-tech text-[10px] text-neon-green">
                    {p.economia}
                  </span>
                )}
              </div>
              <p className="mt-3">
                <Preco cents={p.precoCents} confirmado={precoConfirmado(p.procedencia)} />
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{p.unidade}</p>
              {p.id !== "avulso" && (
                <div className="mt-5">
                  <Botao
                    variante={p.id === "mensal" ? "primario" : "secundario"}
                    onClick={() => contratar(p.id as "mensal" | "anual")}
                    carregando={ocupado === "Contratando…"}
                  >
                    Contratar
                  </Botao>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          O plano é debitado do seu saldo e vale por um período fixo — não há cobrança recorrente
          automática, e por isso nada é cobrado sem você clicar. Renovar é um novo débito,
          explícito.
        </p>
      </div>
    </Secao>
  );
}

/* --------------------------------------------- agente de Analytics */

function AgenteAnalytics({
  estado,
  aoMudar,
}: {
  estado: EstadoAgente | null;
  aoMudar: () => Promise<void>;
}) {
  const config = agente("analytics-afiliado");
  const [perfil, setPerfil] = useState({ nicho: "", seguidores: "", estilo: "" });
  const [recomendadas, setRecomendadas] = useState<OfertaRecomendada[] | null>(null);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [kit, setKit] = useState<KitCriativo | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const produtoEscolhido = useMemo(
    () => affiliateProducts.find((p) => p.id === escolhida) ?? null,
    [escolhida],
  );

  async function entrevistar() {
    if (!perfil.nicho.trim()) {
      setErro("Diga pelo menos o seu nicho — é o que ela usa para escolher.");
      return;
    }
    setErro(null);
    setOcupado("A Veronica está lendo seu perfil…");
    try {
      const res = await recomendarOferta({ data: perfil });
      if (res.ok) {
        setRecomendadas(res.ofertas);
        setEscolhida(res.ofertas[0]?.produtoId ?? null);
        setKit(null);
      } else {
        setErro(res.error);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao recomendar.");
    } finally {
      setOcupado(null);
    }
  }

  async function gerar() {
    if (!escolhida) return;
    setErro(null);
    setOcupado("Montando o criativo…");
    try {
      const res = await gerarKitCriativo({ data: { produtoId: escolhida } });
      if (res.ok) setKit(res.kit);
      else
        setErro(
          res.error === "insufficient_funds"
            ? "Saldo insuficiente para o kit avulso. Recarregue em [04] ou contrate o mensal."
            : res.error,
        );
      await aoMudar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao gerar o kit.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <Secao id="analytics" numero="03" titulo={config.nome}>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {config.promessa} A venda acontece na Shopee, com o seu código carimbado no link — o Hub
        escolhe a oferta, escreve o criativo e mede o encaminhamento.
      </p>

      {!hasAffiliateProducts && (
        <div className="mt-6">
          <Aviso>
            Nenhuma oferta no catálogo agora. Produto com link curto fica fora do ar de propósito:
            link curto descarta o carimbo e a comissão cairia para outra pessoa.
          </Aviso>
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        {/* Tempo 1 — entrevista */}
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg">
            <span className="font-mono-tech text-xs text-neon-green">1.</span>
            Ela te entrevista
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Três respostas curtas. É o que ela precisa para não te mandar vender ração se você fala
            de maquiagem.
          </p>
          <div className="mt-5 space-y-3">
            {[
              {
                campo: "nicho" as const,
                rotulo: "Seu nicho",
                exemplo: "maquiagem pra pele oleosa",
              },
              {
                campo: "seguidores" as const,
                rotulo: "Tamanho do público",
                exemplo: "2 mil no TikTok",
              },
              {
                campo: "estilo" as const,
                rotulo: "Seu estilo",
                exemplo: "falo rápido, sem roteiro",
              },
            ].map((c) => (
              <label key={c.campo} className="block">
                <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                  {c.rotulo}
                </span>
                <input
                  value={perfil[c.campo]}
                  onChange={(e) => setPerfil((p) => ({ ...p, [c.campo]: e.target.value }))}
                  placeholder={c.exemplo}
                  className="mt-1 w-full min-h-11 rounded-sm border border-border/60 bg-background px-3 text-sm outline-none focus:border-neon-green/60"
                />
              </label>
            ))}
          </div>
          <div className="mt-5">
            <Botao
              onClick={entrevistar}
              disabled={!hasAffiliateProducts}
              carregando={ocupado === "A Veronica está lendo seu perfil…"}
            >
              <Sparkles className="h-4 w-4" />
              Me diz o que vender
            </Botao>
          </div>
        </div>

        {/* Tempo 2 — oferta */}
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg">
            <span className="font-mono-tech text-xs text-neon-green">2.</span>
            Ela escolhe a oferta
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Do catálogo real, nunca de um produto inventado. Você troca se discordar.
          </p>

          {!recomendadas ? (
            <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-sm border border-dashed border-border/60 p-5 text-center text-sm text-muted-foreground">
              Responda ao lado e as ofertas aparecem aqui, em ordem.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {recomendadas.map((o, i) => (
                <button
                  key={o.produtoId}
                  type="button"
                  onClick={() => {
                    setEscolhida(o.produtoId);
                    setKit(null);
                  }}
                  className={`w-full rounded-sm border p-4 text-left transition ${
                    escolhida === o.produtoId
                      ? "border-neon-green bg-neon-green/5"
                      : "border-border/60 hover:border-neon-green/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="font-mono-tech text-xs text-neon-green">{i + 1}º</span>
                    <div>
                      <p className="text-sm font-medium leading-snug">{o.nome}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {o.porque}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tempo 3 — criativo */}
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg">
            <span className="font-mono-tech text-xs text-neon-green">3.</span>
            Ela escreve o criativo
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Gancho, roteiro cena a cena, legenda e hashtags. Você grava e posta.
          </p>

          <div className="mt-5">
            <Botao
              onClick={gerar}
              disabled={!escolhida}
              carregando={ocupado === "Montando o criativo…"}
            >
              <TrendingUp className="h-4 w-4" />
              {estado?.liberado
                ? "Gerar kit"
                : `Gerar kit · ${formatarBRL(config.planos[0].precoCents)}`}
            </Botao>
          </div>

          {kit ? (
            <div className="mt-5 space-y-4 rounded-sm border border-border/60 p-4">
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">
                  gancho
                </p>
                <p className="mt-1 text-sm font-medium leading-snug">{kit.gancho}</p>
              </div>
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                  roteiro
                </p>
                <ul className="mt-2 space-y-2">
                  {kit.roteiro.map((c, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      <span className="font-mono-tech text-xs text-neon-green">{c.segundos}</span>{" "}
                      {c.acao}
                      {c.fala && <em className="block text-muted-foreground">“{c.fala}”</em>}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                  legenda
                </p>
                <p className="mt-1 text-sm leading-relaxed">{kit.legenda}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {kit.hashtags.map((h) => (
                  <span
                    key={h}
                    className="rounded-full border border-border/60 px-2 py-0.5 font-mono-tech text-[10px] text-muted-foreground"
                  >
                    {h.startsWith("#") ? h : `#${h}`}
                  </span>
                ))}
              </div>
              {produtoEscolhido && (
                <Link
                  to="/veronica-analytics"
                  className="inline-flex items-center gap-1.5 border-t border-border/40 pt-3 text-sm text-neon-green hover:underline"
                >
                  pegar meu link rastreado <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-sm border border-dashed border-border/60 p-5 text-center text-sm text-muted-foreground">
              Escolha uma oferta e o criativo aparece aqui, pronto para gravar.
            </div>
          )}
        </div>
      </div>

      {erro && (
        <div className="mt-8">
          <Aviso tom="erro">{erro}</Aviso>
        </div>
      )}

      {/* Acompanhamento — o quarto tempo */}
      <div className="mt-12 rounded-sm border border-border/60 p-6">
        <h3 className="font-display text-lg">4. Ela cobra o resultado</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Depois que você posta, o clique no seu link é medido e volta em relatório — quantos
          saíram, de qual oferta, em qual colocação. É o que diz se a próxima leva muda de produto
          ou de gancho.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/veronica-analytics"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border/60 px-5 text-sm hover:border-neon-green/60"
          >
            Ver o painel e o feed de tendências <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/veronica-rede"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border/60 px-5 text-sm hover:border-neon-green/60"
          >
            Entrar na Veronica Rede
          </Link>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          A comissão é paga pela Shopee, pelo relatório de Sub_id — o Hub mede o encaminhamento, não
          o pagamento. Crédito automático de comissão ao divulgador ainda não existe.
        </p>
      </div>
    </Secao>
  );
}
