/**
 * /veronica-pharma — plataforma de abastecimento para redes de farmácia,
 * operada pelo agente Veronica Supply.
 *
 * O centro da página é o produto funcionando: um painel com uma rede
 * demonstrativa (dados fictícios, identificados na tela) e a opção de rodar
 * a mesma análise sobre a planilha do visitante — lida e calculada no
 * navegador, sem envio a servidor. Aprovar uma decisão aqui só muda a tela;
 * no piloto, a aprovação vira pedido no sistema da rede.
 */

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  ClipboardCheck,
  Database,
  Download,
  FileSpreadsheet,
  History,
  Info,
  KeyRound,
  Layers,
  Lock,
  MessageCircle,
  PackageCheck,
  Plus,
  Receipt,
  RefreshCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Store,
  Upload,
  Users,
} from "lucide-react";
import { SiteHeader, SiteFooter, SOCIAL_LINKS } from "@/components/SiteChrome";
import {
  analisar,
  formatarBRL,
  formatarData,
  hojeEmBrasilia,
  lerPlanilha,
  paraPlanilha,
  plural,
  PARAMETROS_PADRAO,
  type Decisao,
  type ItemAnalisado,
  type LinhaEstoque,
  type Parametros,
  type ResultadoLeitura,
  type StatusItem,
  type TipoDecisao,
} from "./engine";
import { linhasDemonstrativas } from "./demo-data";
import {
  AUTOMACOES,
  DISPONIBILIDADE,
  FUNDACOES,
  PASSOS,
  PERFIS,
  PERGUNTAS,
  VISOES,
  type Disponibilidade,
  type Visao,
} from "./content";
import "./pharma.css";

/* ---------------------------------------------------------- utilidades */

function whatsapp(msg: string) {
  return `${SOCIAL_LINKS.whatsapp}?text=${encodeURIComponent(msg)}`;
}

const MSG_PILOTO =
  "Olá! Vi a Veronica Pharma e quero conversar sobre um piloto para a minha rede de farmácias.";

const STATUS: Record<StatusItem, { rotulo: string; tom: string; ordem: number }> = {
  vencido: { rotulo: "Vencido", tom: "crit", ordem: 0 },
  ruptura: { rotulo: "Risco de ruptura", tom: "crit", ordem: 1 },
  validade: { rotulo: "Validade", tom: "warn", ordem: 2 },
  repor: { rotulo: "Repor", tom: "info", ordem: 3 },
  excesso: { rotulo: "Excesso", tom: "mute", ordem: 4 },
  ok: { rotulo: "Em dia", tom: "ok", ordem: 5 },
};

const TIPO: Record<TipoDecisao, { rotulo: string; icone: typeof Check }> = {
  vencido: { rotulo: "Lote vencido", icone: AlertTriangle },
  transferencia: { rotulo: "Transferência preparada", icone: ArrowRightLeft },
  pedido: { rotulo: "Pedido aguardando aprovação", icone: Receipt },
  validade: { rotulo: "Risco de validade", icone: CalendarClock },
};

const PRIORIDADE: Record<Decisao["prioridade"], { rotulo: string; tom: string }> = {
  1: { rotulo: "Agir hoje", tom: "crit" },
  2: { rotulo: "Esta semana", tom: "warn" },
  3: { rotulo: "Planejar", tom: "mute" },
};

type EstadoDecisao = "aprovada" | "encaminhada" | "descartada";
type Papel = "proprietario" | "gerente";

function numero(n: number) {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

/** Excel no Brasil costuma salvar CSV em Windows-1252, não em UTF-8. */
async function lerArquivoComoTexto(arquivo: File) {
  let bytes = new Uint8Array(await arquivo.arrayBuffer());
  // Marca de UTF-8 no começo sai antes, para não virar "ï»¿" no fallback.
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) bytes = bytes.subarray(3);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

function baixarModelo(linhas: LinhaEstoque[]) {
  const blob = new Blob(["\uFEFF" + paraPlanilha(linhas)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo-veronica-pharma.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Pill({ d }: { d: Disponibilidade }) {
  return (
    <span className={`vp-pill ${d === "agora" ? "vp-pill-now" : "vp-pill-next"}`}>
      {d === "agora" ? <Check size={12} /> : <Layers size={12} />}
      {DISPONIBILIDADE[d]}
    </span>
  );
}

function Cabecalho({
  rotulo,
  titulo,
  children,
}: {
  rotulo: string;
  titulo: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="vp-section-head">
      <span className="vp-eyebrow">{rotulo}</span>
      <h2>{titulo}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

/* --------------------------------------------------------------- página */

export function VeronicaPharmaPage() {
  const hoje = useMemo(() => hojeEmBrasilia(), []);
  const demo = useMemo(() => linhasDemonstrativas(hoje), [hoje]);
  const analiseDemo = useMemo(() => analisar(demo, { ...PARAMETROS_PADRAO, hoje }), [demo, hoje]);

  return (
    <div className="vp">
      <SiteHeader />
      <main>
        <Hero analise={analiseDemo} />
        <Visoes />
        <Demonstracao hoje={hoje} demo={demo} />
        <Automacoes />
        <Estrutura />
        <Implantacao />
        <Perguntas />
        <Fechamento demo={demo} />
      </main>
      <div className="vp-disclaimer">
        <p className="vp-wrap">
          Veronica Pharma é um produto da Yo Lab & co., independente de laboratórios, distribuidoras
          e redes, sem vínculo, parceria ou endosso de nenhuma marca citada no setor. O painel desta
          página usa uma rede fictícia, com produtos de nome genérico e fornecedores inventados. O
          agente não faz dispensação nem orientação a paciente; a responsabilidade técnica segue com
          o farmacêutico responsável de cada estabelecimento.
        </p>
      </div>
      <SiteFooter tagline="Veronica Pharma · abastecimento para redes de farmácia" />
    </div>
  );
}

/* ----------------------------------------------------------------- hero */

function Hero({ analise }: { analise: ReturnType<typeof analisar> }) {
  // O feed mostra o que o motor realmente encontrou no cenário demonstrativo:
  // uma decisão de cada tipo, na ordem de prioridade.
  const feed = useMemo(
    () =>
      (["transferencia", "pedido", "validade"] as TipoDecisao[])
        .map((t) => analise.decisoes.find((d) => d.tipo === t))
        .filter((d): d is Decisao => Boolean(d)),
    [analise],
  );

  return (
    <section className="vp-hero">
      <div className="vp-wrap vp-hero-grid">
        <div>
          <span className="vp-eyebrow">Veronica Pharma · operada por Veronica Supply</span>
          <h1>
            Sua rede abastecida. <span>Sua operação</span> sob controle.
          </h1>
          <p className="vp-lead">
            Compras, estoque e validade de todas as filiais numa só operação. O agente Veronica
            Supply antecipa a falta, usa o estoque que a rede já tem e prepara cada pedido para a
            sua aprovação — com a conta à mostra.
          </p>
          <div className="vp-actions">
            <a className="vp-btn vp-btn-primary" href="#demonstracao">
              <span className="vp-btn-dot" aria-hidden />
              Explorar demonstração
            </a>
            <a
              className="vp-btn vp-btn-ghost"
              href={whatsapp(MSG_PILOTO)}
              target="_blank"
              rel="noreferrer"
            >
              Solicitar piloto para minha rede <ArrowRight size={16} />
            </a>
          </div>
          <div className="vp-hero-meta">
            <span>
              <Lock size={14} /> Planilha analisada no seu navegador
            </span>
            <span>
              <Scale size={14} /> Regras conferíveis, não palpite
            </span>
            <span>
              <BadgeCheck size={14} /> Nada sai sem aprovação
            </span>
          </div>
        </div>

        <div className="vp-console" aria-label="Exemplo do feed do agente Veronica Supply">
          <div className="vp-console-bar">
            <span className="vp-console-agent">
              <span className="vp-avatar" aria-hidden>
                S
              </span>
              Veronica Supply
            </span>
            <span className="vp-live">Rede demonstrativa</span>
          </div>
          <div className="vp-console-kpis">
            <div>
              <strong>{analise.totais.rupturas}</strong>
              <span>rupturas previstas</span>
            </div>
            <div>
              <strong>{numero(analise.totais.transferenciaUnidades)}</strong>
              <span>un. a transferir</span>
            </div>
            <div>
              <strong>{analise.decisoes.length}</strong>
              <span>decisões abertas</span>
            </div>
          </div>
          <ul className="vp-feed">
            {feed.map((d) => {
              const T = TIPO[d.tipo];
              return (
                <li key={d.id}>
                  <span className="vp-feed-kind">
                    <T.icone size={12} /> {T.rotulo} · {d.filial}
                  </span>
                  <p className="vp-feed-title">{d.titulo}</p>
                  <p className="vp-feed-why">{d.motivo}</p>
                </li>
              );
            })}
          </ul>
          <p className="vp-console-foot">
            Calculado agora pelo mesmo motor da demonstração abaixo, sobre dados fictícios.
          </p>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- visões */

function Visoes() {
  const [ativa, setAtiva] = useState<Visao["id"]>("rede");
  const visao = VISOES.find((v) => v.id === ativa)!;
  return (
    <section className="vp-section" id="visoes">
      <div className="vp-wrap">
        <Cabecalho rotulo="Uma operação, quatro visões" titulo="Cada elo vê o que precisa decidir.">
          A mesma base de dados atende quem compra, quem abastece e quem fabrica. Muda o recorte e
          muda a alçada; a conta é a mesma.
        </Cabecalho>
        <div className="vp-tabs" role="tablist" aria-label="Visões por público">
          {VISOES.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              id={`visao-${v.id}`}
              aria-selected={v.id === ativa}
              aria-controls="visao-painel"
              className="vp-tab"
              onClick={() => setAtiva(v.id)}
            >
              {v.rotulo}
            </button>
          ))}
        </div>
        <div
          className="vp-view"
          id="visao-painel"
          role="tabpanel"
          aria-labelledby={`visao-${visao.id}`}
        >
          <div className="vp-card">
            <Pill d={visao.disponibilidade} />
            <h3 style={{ marginTop: 14 }}>{visao.titulo}</h3>
            <p>{visao.resumo}</p>
          </div>
          <div className="vp-card">
            <span className="vp-card-label">O que vê</span>
            <ul className="vp-list">
              {visao.ve.map((t) => (
                <li key={t}>
                  <Check size={15} />
                  {t}
                </li>
              ))}
            </ul>
            <span className="vp-card-label" style={{ display: "block", marginTop: 20 }}>
              O que decide
            </span>
            <ul className="vp-list">
              {visao.decide.map((t) => (
                <li key={t}>
                  <BadgeCheck size={15} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="vp-card">
            <span className="vp-card-label">O que a Veronica Supply faz</span>
            <ul className="vp-list">
              {visao.supply.map((t) => (
                <li key={t}>
                  <Sparkles size={15} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- demonstração */

function Demonstracao({ hoje, demo }: { hoje: string; demo: LinhaEstoque[] }) {
  const [fonte, setFonte] = useState<"demo" | "planilha">("demo");
  const [leitura, setLeitura] = useState<(ResultadoLeitura & { nome: string }) | null>(null);
  const [params, setParams] = useState<Omit<Parametros, "hoje">>(PARAMETROS_PADRAO);
  const [filial, setFilial] = useState("todas");
  const [papel, setPapel] = useState<Papel>("proprietario");
  const [estados, setEstados] = useState<Record<string, EstadoDecisao>>({});

  const linhas = fonte === "planilha" && leitura ? leitura.linhas : demo;
  const analise = useMemo(() => analisar(linhas, { ...params, hoje }), [linhas, params, hoje]);
  const filiais = useMemo(() => [...new Set(linhas.map((l) => l.filial))].sort(), [linhas]);

  const noRecorte = <T extends { filial: string }>(x: T) =>
    filial === "todas" || x.filial === filial;
  const itens = analise.itens.filter(noRecorte);
  const decisoes = analise.decisoes.filter((d) => filial === "todas" || d.filiais.includes(filial));

  const kpis = useMemo(() => {
    const compraValor = itens.reduce((s, i) => s + i.sugestaoCompra * (i.custoUnitario ?? 0), 0);
    const valorEmRisco = itens.reduce((s, i) => s + i.unidadesEmRisco * (i.custoUnitario ?? 0), 0);
    return {
      rupturas: itens.filter((i) => i.status === "ruptura").length,
      compraValor,
      compraUnidades: itens.reduce((s, i) => s + i.sugestaoCompra, 0),
      transferidas: itens.reduce((s, i) => s + i.recebeTransferencia, 0),
      valorEmRisco,
      unidadesEmRisco: itens.reduce((s, i) => s + i.unidadesEmRisco, 0),
      semCusto: itens.some((i) => i.custoUnitario === null),
    };
  }, [itens]);

  const usarPlanilha = useCallback((r: ResultadoLeitura & { nome: string }) => {
    setLeitura(r);
    setEstados({});
    setFilial("todas");
    if (r.linhas.length > 0) setFonte("planilha");
  }, []);

  const decidir = (id: string, estado: EstadoDecisao | null) =>
    setEstados((atual) => {
      const novo = { ...atual };
      if (estado) novo[id] = estado;
      else delete novo[id];
      return novo;
    });

  const resolvidas = decisoes.filter((d) => estados[d.id]).length;
  const [todasDecisoes, setTodasDecisoes] = useState(false);
  const LIMITE_DECISOES = 5;
  const decisoesVisiveis = todasDecisoes ? decisoes : decisoes.slice(0, LIMITE_DECISOES);

  return (
    <section className="vp-section vp-demo" id="demonstracao">
      <div className="vp-wrap">
        <Cabecalho rotulo="Demonstração" titulo="O painel que o dono da rede abre de manhã.">
          Escolha a filial, mude as regras e aprove as decisões. Os números são recalculados na hora
          pelo mesmo motor que roda no piloto. Depois, teste com a sua planilha.
        </Cabecalho>

        <div className="vp-app">
          <div className="vp-app-bar">
            <div className="vp-app-title">
              <Store size={18} />
              {fonte === "demo" ? "Rede demonstrativa" : (leitura?.nome ?? "Sua planilha")}
              <span className="vp-tag">
                {fonte === "demo" ? (
                  <>
                    <Info size={12} /> Dados fictícios
                  </>
                ) : (
                  <>
                    <Lock size={12} /> Só no seu navegador
                  </>
                )}
              </span>
            </div>
            <div className="vp-controls">
              {leitura && leitura.linhas.length > 0 ? (
                <label>
                  <span className="vp-sr">Fonte dos dados</span>
                  <select
                    className="vp-select"
                    value={fonte}
                    onChange={(e) => {
                      setFonte(e.target.value as "demo" | "planilha");
                      setFilial("todas");
                      setEstados({});
                    }}
                  >
                    <option value="demo">Rede demonstrativa</option>
                    <option value="planilha">Minha planilha</option>
                  </select>
                </label>
              ) : null}
              <label>
                <span className="vp-sr">Filial</span>
                <select
                  className="vp-select"
                  value={filial}
                  onChange={(e) => setFilial(e.target.value)}
                >
                  <option value="todas">Todas as filiais ({filiais.length})</option>
                  {filiais.map((f) => (
                    <option key={f} value={f}>
                      Filial {f}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="vp-sr">Ver como</span>
                <select
                  className="vp-select"
                  value={papel}
                  onChange={(e) => setPapel(e.target.value as Papel)}
                >
                  <option value="proprietario">Ver como: proprietário</option>
                  <option value="gerente">Ver como: gerente de filial</option>
                </select>
              </label>
            </div>
          </div>

          <div className="vp-kpis">
            <div className="vp-kpi">
              <span className="vp-card-label">Ruptura prevista</span>
              <strong>{kpis.rupturas}</strong>
              <small>itens que faltam antes da entrega</small>
            </div>
            <div className="vp-kpi">
              <span className="vp-card-label">Compra sugerida</span>
              <strong>
                {kpis.semCusto
                  ? numero(kpis.compraUnidades) + " un."
                  : formatarBRL(kpis.compraValor)}
              </strong>
              <small>
                {kpis.semCusto
                  ? "informe o custo para ver o valor"
                  : `${numero(kpis.compraUnidades)} un., já descontadas transferências`}
              </small>
            </div>
            <div className="vp-kpi">
              <span className="vp-card-label">Transferências</span>
              <strong>{numero(kpis.transferidas)} un.</strong>
              <small>que deixam de ser compradas</small>
            </div>
            <div className="vp-kpi">
              <span className="vp-card-label">Em risco de validade</span>
              <strong>
                {kpis.semCusto
                  ? numero(kpis.unidadesEmRisco) + " un."
                  : formatarBRL(kpis.valorEmRisco)}
              </strong>
              <small>
                dentro de {params.horizonteValidadeDias} dias, depois das transferências
              </small>
            </div>
          </div>

          <div className="vp-app-body">
            <TabelaItens itens={itens} />
            <aside className="vp-decisions" aria-label="Decisões preparadas pela Veronica Supply">
              <div className="vp-decisions-head">
                <h3>
                  <span className="vp-avatar" aria-hidden>
                    S
                  </span>
                  Para sua decisão
                </h3>
                <span className="vp-badge vp-badge-mute vp-num">
                  {resolvidas}/{decisoes.length}
                </span>
              </div>
              {decisoes.length === 0 ? (
                <p className="vp-note vp-note-ok">
                  <Check size={16} /> Nada pede decisão neste recorte.
                </p>
              ) : (
                decisoesVisiveis.map((d) => (
                  <CartaoDecisao
                    key={d.id}
                    d={d}
                    estado={estados[d.id]}
                    papel={papel}
                    alcada={params.alcadaGerente}
                    onDecidir={decidir}
                  />
                ))
              )}
              {decisoes.length > LIMITE_DECISOES ? (
                <button
                  type="button"
                  className="vp-btn vp-btn-ghost vp-btn-sm vp-more"
                  style={{ width: "100%" }}
                  onClick={() => setTodasDecisoes((t) => !t)}
                >
                  {todasDecisoes ? "Mostrar só as principais" : `Ver todas as ${decisoes.length}`}
                </button>
              ) : null}
              <p
                className="vp-console-foot"
                style={{ color: "var(--vp-ink-3)", padding: "12px 2px 0" }}
              >
                Aprovar aqui só muda a tela. No piloto, a aprovação vira pedido no sistema da rede,
                com registro de quem aprovou.
              </p>
            </aside>
          </div>
        </div>

        <div className="vp-params">
          <Regras params={params} setParams={setParams} />
          <Metodo />
        </div>

        <Importacao leitura={leitura} onLer={usarPlanilha} demo={demo} />
      </div>
    </section>
  );
}

function TabelaItens({ itens }: { itens: ItemAnalisado[] }) {
  const [soExcecoes, setSoExcecoes] = useState(true);
  const [todos, setTodos] = useState(false);
  const ordenados = useMemo(
    () =>
      [...itens]
        .filter((i) => !soExcecoes || i.status !== "ok")
        .sort(
          (a, b) =>
            STATUS[a.status].ordem - STATUS[b.status].ordem ||
            (a.coberturaDias ?? Infinity) - (b.coberturaDias ?? Infinity),
        ),
    [itens, soExcecoes],
  );
  const LIMITE = 40;
  const visiveis = todos ? ordenados : ordenados.slice(0, LIMITE);

  return (
    <div className="vp-table-area">
      <div className="vp-table-tools">
        <span>
          {plural(ordenados.length, "item", "itens")}
          {soExcecoes ? " com exceção" : ""} de {itens.length}
        </span>
        <label className="vp-check">
          <input
            type="checkbox"
            checked={soExcecoes}
            onChange={(e) => setSoExcecoes(e.target.checked)}
          />
          Só exceções
        </label>
      </div>
      <div className="vp-table-scroll">
        <table className="vp-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Situação</th>
              <th className="n">Saldo</th>
              <th className="n">Cobertura</th>
              <th>Validade</th>
              <th>Ação sugerida</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((i) => (
              <tr key={i.chave}>
                <td>
                  <span className="vp-prod">{i.produto}</span>
                  <span className="vp-sub">
                    Filial {i.filial} · {i.sku} · {numero(i.demandaDia)}/dia
                    {i.emTransito > 0 ? ` · ${numero(i.emTransito)} em trânsito` : ""}
                  </span>
                </td>
                <td>
                  <span className={`vp-badge vp-badge-${STATUS[i.status].tom}`}>
                    {STATUS[i.status].rotulo}
                  </span>
                </td>
                <td className="n">{numero(i.estoque)}</td>
                <td className="n">
                  {i.coberturaDias === null ? "sem giro" : `${i.coberturaDias} d`}
                </td>
                <td>
                  {i.validade ? (
                    <>
                      {formatarData(i.validade)}
                      {i.unidadesEmRisco > 0 ? (
                        <span className="vp-sub">{numero(i.unidadesEmRisco)} un. em risco</span>
                      ) : null}
                    </>
                  ) : (
                    <span className="vp-sub">não informada</span>
                  )}
                </td>
                <td>
                  <AcaoDoItem i={i} />
                </td>
              </tr>
            ))}
            {visiveis.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--vp-ink-3)" }}>
                  Nenhum item com exceção neste recorte.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {ordenados.length > LIMITE ? (
        <button
          type="button"
          className="vp-btn vp-btn-ghost vp-btn-sm vp-more"
          onClick={() => setTodos((t) => !t)}
        >
          {todos ? "Mostrar menos" : `Mostrar todos os ${ordenados.length}`}
        </button>
      ) : null}
    </div>
  );
}

function AcaoDoItem({ i }: { i: ItemAnalisado }) {
  const partes: string[] = [];
  if (i.status === "vencido") partes.push("Segregar o lote");
  if (i.recebeTransferencia > 0)
    partes.push(`Receber ${numero(i.recebeTransferencia)} de outra filial`);
  if (i.enviaTransferencia > 0)
    partes.push(`Enviar ${numero(i.enviaTransferencia)} a outra filial`);
  if (i.sugestaoCompra > 0) partes.push(`Comprar ${numero(i.sugestaoCompra)}`);
  if (i.status === "validade") partes.push("Negociar troca ou giro");
  if (partes.length === 0) return <span className="vp-sub">—</span>;
  return (
    <>
      <span className="vp-prod">{partes[0]}</span>
      {partes.slice(1).map((t) => (
        <span className="vp-sub" key={t}>
          {t}
        </span>
      ))}
    </>
  );
}

function CartaoDecisao({
  d,
  estado,
  papel,
  alcada,
  onDecidir,
}: {
  d: Decisao;
  estado: EstadoDecisao | undefined;
  papel: Papel;
  alcada: number;
  onDecidir: (id: string, estado: EstadoDecisao | null) => void;
}) {
  const T = TIPO[d.tipo];
  const P = PRIORIDADE[d.prioridade];
  const precisaDono = d.exigeProprietario && papel === "gerente";
  return (
    <article className="vp-decision" data-state={estado ?? "aberta"}>
      <div className="vp-decision-top">
        <span className={`vp-badge vp-badge-${P.tom}`}>{P.rotulo}</span>
        <span className="vp-badge vp-badge-mute">
          <T.icone size={11} /> {T.rotulo}
        </span>
        <span>Filial {d.filial}</span>
      </div>
      <h4>{d.titulo}</h4>
      <p>{d.motivo}</p>
      {d.linhas.length > 1 ? (
        <ul className="vp-decision-lines">
          {d.linhas.map((l) => (
            <li key={l.sku}>
              <span>{l.produto}</span>
              <span className="vp-num">{numero(l.quantidade)} un.</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p>
        <strong>Ação: </strong>
        {d.acao}
      </p>
      <div className="vp-decision-foot">
        <span className="vp-decision-value">
          {d.valor !== null ? formatarBRL(d.valor) : null}
          {d.exigeProprietario ? (
            <span
              className="vp-badge vp-badge-owner"
              style={{ marginLeft: d.valor !== null ? 8 : 0 }}
              title={`Acima da alçada do gerente (${formatarBRL(alcada)})`}
            >
              <KeyRound size={11} /> Alçada do proprietário
            </span>
          ) : null}
        </span>
        <div className="vp-decision-btns">
          {estado ? (
            <>
              <span className="vp-badge vp-badge-ok" style={{ alignSelf: "center" }}>
                {estado === "aprovada" ? (
                  <>
                    <Check size={11} /> Aprovada
                  </>
                ) : estado === "encaminhada" ? (
                  "Enviada ao proprietário"
                ) : (
                  "Descartada"
                )}
              </span>
              <button type="button" className="vp-mini" onClick={() => onDecidir(d.id, null)}>
                Desfazer
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="vp-mini"
                onClick={() => onDecidir(d.id, "descartada")}
              >
                Descartar
              </button>
              {precisaDono ? (
                <button
                  type="button"
                  className="vp-mini vp-mini-dark"
                  onClick={() => onDecidir(d.id, "encaminhada")}
                >
                  Enviar ao proprietário
                </button>
              ) : (
                <button
                  type="button"
                  className="vp-mini vp-mini-dark"
                  onClick={() => onDecidir(d.id, "aprovada")}
                >
                  Aprovar
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function Regras({
  params,
  setParams,
}: {
  params: Omit<Parametros, "hoje">;
  setParams: (p: Omit<Parametros, "hoje">) => void;
}) {
  const campos: {
    k: keyof Omit<Parametros, "hoje">;
    rotulo: string;
    min: number;
    max: number;
    passo: number;
    formato: (n: number) => string;
    ajuda: string;
  }[] = [
    {
      k: "diasSeguranca",
      rotulo: "Estoque de segurança",
      min: 0,
      max: 20,
      passo: 1,
      formato: (n) => plural(n, "dia", "dias"),
      ajuda: "Folga para venda acima do normal e entrega atrasada.",
    },
    {
      k: "cicloDias",
      rotulo: "Ciclo de compra",
      min: 7,
      max: 45,
      passo: 1,
      formato: (n) => plural(n, "dia", "dias"),
      ajuda: "De quanto em quanto tempo a filial compra cada item.",
    },
    {
      k: "horizonteValidadeDias",
      rotulo: "Radar de validade",
      min: 30,
      max: 180,
      passo: 15,
      formato: (n) => plural(n, "dia", "dias"),
      ajuda: "Lotes que vencem dentro deste prazo entram na análise.",
    },
    {
      k: "alcadaGerente",
      rotulo: "Alçada do gerente",
      min: 500,
      max: 10000,
      passo: 500,
      formato: formatarBRL,
      ajuda: "Acima disto, a decisão sobe para o proprietário.",
    },
    {
      k: "transferenciaMinima",
      rotulo: "Transferência mínima",
      min: 1,
      max: 50,
      passo: 1,
      formato: (n) => `${n} un.`,
      ajuda: "Abaixo disto, separar e enviar não compensa: vira compra.",
    },
  ];
  const mudou = campos.some((c) => params[c.k] !== PARAMETROS_PADRAO[c.k]);
  return (
    <div className="vp-card">
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}
      >
        <span className="vp-card-label">Regras da rede</span>
        {mudou ? (
          <button type="button" className="vp-mini" onClick={() => setParams(PARAMETROS_PADRAO)}>
            <RefreshCcw size={12} style={{ marginRight: 6, verticalAlign: -1 }} />
            Restaurar
          </button>
        ) : null}
      </div>
      <div className="vp-sliders">
        {campos.map((c) => (
          <div className="vp-slider" key={c.k}>
            <label htmlFor={`regra-${c.k}`}>
              {c.rotulo}
              <output htmlFor={`regra-${c.k}`}>{c.formato(params[c.k])}</output>
            </label>
            <input
              id={`regra-${c.k}`}
              type="range"
              min={c.min}
              max={c.max}
              step={c.passo}
              value={params[c.k]}
              onChange={(e) => setParams({ ...params, [c.k]: Number(e.target.value) })}
            />
            <small>{c.ajuda}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metodo() {
  return (
    <div className="vp-card">
      <span className="vp-card-label">Como calculamos</span>
      <ul className="vp-formulas">
        <li>
          Venda por dia
          <code>vendas dos últimos 30 dias ÷ 30</code>
        </li>
        <li>
          Ponto de pedido — abaixo dele, a filial precisa comprar
          <code>venda/dia × (prazo de entrega + segurança)</code>
        </li>
        <li>
          Quantidade sugerida — o suficiente até o próximo ciclo
          <code>venda/dia × (prazo + ciclo + segurança) − saldo − em trânsito</code>
        </li>
        <li>
          Ruptura prevista — acaba antes de a entrega chegar
          <code>saldo &lt; venda/dia × prazo de entrega</code>
        </li>
        <li>
          Risco de validade — o que não vende até vencer
          <code>saldo − venda/dia × dias até vencer</code>
        </li>
        <li>
          Transferência — antes de comprar, o saldo acima do alvo de outra filial cobre a falta,
          desde que o destino venda o lote antes de vencer.
        </li>
      </ul>
    </div>
  );
}

function Importacao({
  leitura,
  onLer,
  demo,
}: {
  leitura: (ResultadoLeitura & { nome: string }) | null;
  onLer: (r: ResultadoLeitura & { nome: string }) => void;
  demo: LinhaEstoque[];
}) {
  const input = useRef<HTMLInputElement>(null);
  const [sobre, setSobre] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);

  const ler = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    setFalha(null);
    if (/\.(xlsx?|ods)$/i.test(arquivo.name)) {
      setFalha("Salve a planilha como CSV (Arquivo › Salvar como › CSV) e envie de novo.");
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      setFalha("Arquivo acima de 5 MB. Envie um recorte com até 5.000 linhas.");
      return;
    }
    setLendo(true);
    try {
      const texto = await lerArquivoComoTexto(arquivo);
      onLer({ ...lerPlanilha(texto), nome: arquivo.name });
    } catch {
      setFalha("Não consegui ler este arquivo. Confira se é um CSV.");
    } finally {
      setLendo(false);
    }
  };

  return (
    <div className="vp-import" id="planilha">
      <div>
        <label
          className="vp-drop"
          data-over={sobre}
          onDragOver={(e) => {
            e.preventDefault();
            setSobre(true);
          }}
          onDragLeave={() => setSobre(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSobre(false);
            void ler(e.dataTransfer.files[0]);
          }}
        >
          <input
            ref={input}
            type="file"
            accept=".csv,.txt,.tsv,text/csv"
            className="vp-sr"
            onChange={(e) => {
              void ler(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Upload size={22} />
          <strong>{lendo ? "Lendo…" : "Teste com a sua planilha"}</strong>
          <span>Arraste um CSV ou clique para escolher. Nada é enviado: a conta roda aqui.</span>
        </label>
        {falha ? (
          <p className="vp-note vp-note-crit" style={{ marginTop: 12 }}>
            <AlertTriangle size={16} />
            {falha}
          </p>
        ) : null}
        {leitura ? <ResumoLeitura leitura={leitura} /> : null}
      </div>
      <div className="vp-card">
        <span className="vp-card-label">Formato</span>
        <p>
          Uma linha por filial e produto. Obrigatórias: <b>filial</b>, <b>sku</b>, <b>estoque</b> e{" "}
          <b>vendas_30d</b>. Opcionais: produto, em_transito, prazo_entrega_dias, validade
          (dd/mm/aaaa ou mm/aaaa), custo_unitario e fornecedor. Separador ponto e vírgula ou
          vírgula; números no formato brasileiro funcionam.
        </p>
        <div className="vp-actions" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="vp-btn vp-btn-ghost vp-btn-sm"
            onClick={() => baixarModelo(demo)}
          >
            <Download size={14} /> Baixar modelo preenchido
          </button>
        </div>
      </div>
    </div>
  );
}

function ResumoLeitura({ leitura }: { leitura: ResultadoLeitura & { nome: string } }) {
  const ok = leitura.linhas.length;
  const filiais = new Set(leitura.linhas.map((l) => l.filial)).size;
  return (
    <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
      {ok > 0 ? (
        <p className="vp-note vp-note-ok">
          <FileSpreadsheet size={16} />
          <span>
            {leitura.nome}: {plural(ok, "linha analisada", "linhas analisadas")} em{" "}
            {plural(filiais, "filial", "filiais")}. O painel acima já mostra a sua rede.
          </span>
        </p>
      ) : null}
      {leitura.erros.length > 0 ? (
        <div className={`vp-note ${ok > 0 ? "vp-note-warn" : "vp-note-crit"}`}>
          <AlertTriangle size={16} />
          <div>
            {plural(leitura.erros.length, "linha ficou de fora", "linhas ficaram de fora")}:
            <ul>
              {leitura.erros.slice(0, 6).map((e) => (
                <li key={`${e.linha}-${e.motivo}`}>
                  Linha {e.linha}: {e.motivo}
                </li>
              ))}
              {leitura.erros.length > 6 ? <li>e mais {leitura.erros.length - 6}.</li> : null}
            </ul>
          </div>
        </div>
      ) : null}
      {leitura.colunasIgnoradas.length > 0 ? (
        <p className="vp-note vp-note-warn">
          <Info size={16} />
          <span>Colunas não usadas: {leitura.colunasIgnoradas.join(", ")}.</span>
        </p>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------- automações */

const ICONES_AUTOMACAO: Record<string, typeof Check> = {
  reposicao: PackageCheck,
  transferencia: ArrowRightLeft,
  validade: CalendarClock,
  excecao: BadgeCheck,
  cotacao: Scale,
  recebimento: ClipboardCheck,
  consignacao: Receipt,
  whatsapp: MessageCircle,
};

function Automacoes() {
  return (
    <section className="vp-section" id="automacoes">
      <div className="vp-wrap">
        <Cabecalho rotulo="Automações" titulo="Do giro na gôndola ao pedido no fornecedor.">
          Quatro automações já rodam na demonstração acima. As outras quatro entram na implantação,
          conforme o acesso a cada sistema e a cada fornecedor.
        </Cabecalho>
        <div className="vp-auto-grid">
          {AUTOMACOES.map((a) => {
            const Icone = ICONES_AUTOMACAO[a.id] ?? Sparkles;
            return (
              <article className="vp-auto" key={a.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span className="vp-auto-icon">
                    <Icone size={18} />
                  </span>
                  <Pill d={a.disponibilidade} />
                </div>
                <h3>{a.titulo}</h3>
                <p>{a.como}</p>
                <span className="vp-auto-value">{a.valor}</span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ estrutura */

const ICONES_FUNDACAO: Record<string, typeof Check> = {
  isolamento: Lock,
  perfis: Users,
  cadastro: Database,
  integracao: Layers,
  registro: History,
  frescor: RefreshCcw,
};

function Estrutura() {
  return (
    <section className="vp-section vp-dark" id="estrutura">
      <div className="vp-wrap">
        <Cabecalho
          rotulo="Pronta para várias redes"
          titulo="Uma plataforma, cada rede no seu ambiente."
        >
          A implantação organiza cada cliente do grupo econômico até a filial, com visão consolidada
          e individual. A inteligência explica e prepara; estoque, valor e acerto seguem regras
          fixas e auditáveis.
        </Cabecalho>
        <div className="vp-arch">
          <div className="vp-tree" aria-label="Estrutura de uma rede na plataforma">
            <div className="vp-node vp-node-root">
              <span>
                <Building2 size={16} style={{ verticalAlign: -3, marginRight: 8 }} />
                <b>Rede</b>
              </span>
              <small>visão consolidada</small>
            </div>
            <div className="vp-branch">
              {["CNPJ 1", "CNPJ 2"].map((c, i) => (
                <div key={c}>
                  <div className="vp-node">
                    <b>Empresa · {c}</b>
                    <small>contratos e preços</small>
                  </div>
                  <div className="vp-branch">
                    {(i === 0 ? ["Filial Centro", "Filial Norte"] : ["Filial Sul"]).map((f) => (
                      <div className="vp-node" key={f}>
                        <span>
                          <Store size={14} style={{ verticalAlign: -2, marginRight: 8 }} />
                          {f}
                        </span>
                        <small>estoque e alçada</small>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="vp-roles" aria-label="Perfis de acesso">
              {PERFIS.map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
          </div>
          <div className="vp-foundations">
            {FUNDACOES.map((f) => {
              const Icone = ICONES_FUNDACAO[f.id] ?? ShieldCheck;
              return (
                <div key={f.id}>
                  <h3>
                    <Icone size={16} />
                    {f.titulo}
                  </h3>
                  <p>{f.texto}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- implantação */

function Implantacao() {
  return (
    <section className="vp-section" id="implantacao">
      <div className="vp-wrap">
        <Cabecalho rotulo="Implantação" titulo="Começa pela planilha que você já tem.">
          Nada de trocar sistema no primeiro dia. Cada etapa só começa quando a anterior mostrou
          resultado na sua operação.
        </Cabecalho>
        <ol className="vp-steps" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {PASSOS.map((p, i) => (
            <li className={`vp-step${i === 0 ? " vp-step-first" : ""}`} key={p.titulo}>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- perguntas */

function Perguntas() {
  return (
    <section className="vp-section" id="perguntas">
      <div className="vp-wrap">
        <Cabecalho rotulo="Perguntas" titulo="O que todo dono de rede pergunta." />
        <div className="vp-faq">
          {PERGUNTAS.map((q) => (
            <details key={q.p}>
              <summary>
                {q.p}
                <Plus size={18} />
              </summary>
              <p>{q.r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ fechamento */

function Fechamento({ demo }: { demo: LinhaEstoque[] }) {
  return (
    <section className="vp-section vp-final">
      <div className="vp-wrap">
        <span className="vp-eyebrow">Piloto</span>
        <h2>Veja a sua rede no painel antes de qualquer contrato.</h2>
        <p>
          Mande 30 dias de venda e o saldo atual. A gente roda a análise com você e mostra o que a
          Veronica Supply encontraria na sua operação.
        </p>
        <div className="vp-actions">
          <a
            className="vp-btn vp-btn-primary"
            href={whatsapp(MSG_PILOTO)}
            target="_blank"
            rel="noreferrer"
          >
            <span className="vp-btn-dot" aria-hidden />
            Solicitar piloto para minha rede
          </a>
          <button type="button" className="vp-btn vp-btn-ghost" onClick={() => baixarModelo(demo)}>
            <Download size={16} /> Baixar modelo de planilha
          </button>
        </div>
      </div>
    </section>
  );
}
