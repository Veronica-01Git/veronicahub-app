/**
 * Motor da Veronica Pharma — as contas que o agente Veronica Supply explica.
 *
 * Tudo aqui é determinístico e auditável: a mesma planilha e os mesmos
 * parâmetros dão sempre o mesmo resultado, e cada decisão carrega o motivo
 * em números. A IA explica e prepara; quem calcula estoque, valor e
 * quantidade são estas regras. Nenhuma função faz rede: a planilha do
 * visitante é lida e analisada no navegador e não sai dele.
 *
 * Sem import de propósito: os testes (node --test) carregam este arquivo
 * direto, sem bundler.
 */

/* ----------------------------------------------------------------- tipos */

export type LinhaEstoque = {
  filial: string;
  sku: string;
  produto: string;
  /** Saldo físico na filial, em unidades de venda. */
  estoque: number;
  /** Unidades vendidas nos últimos 30 dias. */
  vendas30d: number;
  /** Pedido já feito e ainda não recebido. */
  emTransito: number;
  /** Dias entre fazer o pedido e o produto estar na gôndola. */
  prazoEntregaDias: number;
  /** Vencimento do lote mais próximo (AAAA-MM-DD), quando informado. */
  validade: string | null;
  custoUnitario: number | null;
  fornecedor: string | null;
};

export type Parametros = {
  /** Folga para variação de venda e atraso de entrega. */
  diasSeguranca: number;
  /** De quanto em quanto tempo a filial compra este item. */
  cicloDias: number;
  /** A partir de quantos dias para vencer o lote entra no radar. */
  horizonteValidadeDias: number;
  /** Acima deste valor, a decisão sobe para o proprietário. */
  alcadaGerente: number;
  /** Abaixo disto, transferir não paga a separação e o frete: compra. */
  transferenciaMinima: number;
  /** Data de referência (AAAA-MM-DD). */
  hoje: string;
};

export const PARAMETROS_PADRAO: Omit<Parametros, "hoje"> = {
  diasSeguranca: 5,
  cicloDias: 14,
  horizonteValidadeDias: 90,
  alcadaGerente: 2000,
  transferenciaMinima: 10,
};

export type StatusItem = "vencido" | "ruptura" | "validade" | "repor" | "excesso" | "ok";

export type ItemAnalisado = LinhaEstoque & {
  chave: string;
  demandaDia: number;
  /** Dias que o saldo atual dura no ritmo de venda. null = item sem giro. */
  coberturaDias: number | null;
  pontoPedido: number;
  alvo: number;
  /** Compra sugerida depois de aproveitar o estoque das outras filiais. */
  sugestaoCompra: number;
  recebeTransferencia: number;
  enviaTransferencia: number;
  diasParaVencer: number | null;
  /** Unidades que, no ritmo atual, vencem antes de vender. */
  unidadesEmRisco: number;
  status: StatusItem;
};

export type Transferencia = {
  id: string;
  sku: string;
  produto: string;
  de: string;
  para: string;
  quantidade: number;
  /** A filial de origem tem lote no radar de validade. */
  escoaValidade: boolean;
  coberturaDestinoDias: number | null;
  prazoDestinoDias: number;
  /** Saldo da origem acima da necessidade dela, antes desta transferência. */
  sobraOrigem: number;
};

export type TipoDecisao = "vencido" | "transferencia" | "pedido" | "validade";

export type Decisao = {
  id: string;
  tipo: TipoDecisao;
  /** 1 = agir hoje … 3 = planejar. */
  prioridade: 1 | 2 | 3;
  /** Filial que recebe a ação. */
  filial: string;
  /** Todas as filiais envolvidas (a transferência envolve duas). */
  filiais: string[];
  titulo: string;
  motivo: string;
  acao: string;
  valor: number | null;
  exigeProprietario: boolean;
  linhas: { sku: string; produto: string; quantidade: number }[];
};

export type Analise = {
  itens: ItemAnalisado[];
  transferencias: Transferencia[];
  decisoes: Decisao[];
  totais: {
    itens: number;
    filiais: number;
    rupturas: number;
    compraUnidades: number;
    compraValor: number;
    transferenciaUnidades: number;
    unidadesEmRisco: number;
    valorEmRisco: number;
    decisoesProprietario: number;
  };
};

/* ---------------------------------------------------------------- datas */

const DIA_MS = 86_400_000;

function diaUTC(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(t);
  // Recusa 2026-02-31 e afins, que o Date "corrige" para março.
  if (d.getUTCMonth() !== Number(m[2]) - 1 || d.getUTCDate() !== Number(m[3])) return null;
  return t;
}

export function diasEntre(deISO: string, ateISO: string): number | null {
  const a = diaUTC(deISO);
  const b = diaUTC(ateISO);
  if (a === null || b === null) return null;
  return Math.round((b - a) / DIA_MS);
}

export function somarDias(iso: string, dias: number): string {
  const t = diaUTC(iso);
  if (t === null) throw new Error(`data inválida: ${iso}`);
  return new Date(t + dias * DIA_MS).toISOString().slice(0, 10);
}

/** Data de hoje no fuso de Brasília — igual no servidor e no navegador. */
export function hojeEmBrasilia(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

/* -------------------------------------------------------------- análise */

const arred = (n: number) => Math.round(n * 100) / 100;

export function plural(n: number, um: string, varios: string) {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;
}
const un = (n: number) => `${n.toLocaleString("pt-BR")} un.`;
const dias = (n: number) => plural(n, "dia", "dias");

function chaveDe(l: LinhaEstoque) {
  return `${l.filial}::${l.sku}`;
}

export function analisar(linhas: LinhaEstoque[], p: Parametros): Analise {
  // 1. Métricas de cada filial × produto, sem olhar as outras filiais.
  const base = linhas.map((l) => {
    const demandaDia = Math.max(0, l.vendas30d) / 30;
    const seguranca = demandaDia * p.diasSeguranca;
    const pontoPedido = demandaDia * l.prazoEntregaDias + seguranca;
    const alvo = demandaDia * (l.prazoEntregaDias + p.cicloDias) + seguranca;
    const disponivel = l.estoque + l.emTransito;
    const necessidade = disponivel <= pontoPedido ? Math.max(0, Math.ceil(alvo - disponivel)) : 0;
    // Só o saldo físico acima do alvo pode sair da loja.
    const sobra = Math.max(0, Math.min(l.estoque, Math.floor(disponivel - alvo)));
    const diasParaVencer = l.validade ? diasEntre(p.hoje, l.validade) : null;
    let unidadesEmRisco = 0;
    if (diasParaVencer !== null && diasParaVencer <= p.horizonteValidadeDias) {
      // Conservador: todo o saldo é tratado como do lote mais próximo.
      unidadesEmRisco =
        diasParaVencer < 0
          ? l.estoque
          : Math.max(0, l.estoque - Math.floor(demandaDia * diasParaVencer));
    }
    return {
      linha: l,
      chave: chaveDe(l),
      demandaDia,
      pontoPedido,
      alvo,
      necessidade,
      sobra,
      diasParaVencer,
      unidadesEmRisco,
      recebe: 0,
      envia: 0,
    };
  });

  // 2. Antes de comprar, aproveita o que sobra nas outras filiais.
  const transferencias: Transferencia[] = [];
  const porSku = new Map<string, typeof base>();
  for (const b of base) {
    const lista = porSku.get(b.linha.sku) ?? [];
    lista.push(b);
    porSku.set(b.linha.sku, lista);
  }
  for (const [sku, grupo] of porSku) {
    const destinos = grupo
      .filter((b) => b.necessidade > 0 && b.demandaDia > 0)
      .sort((a, b) => a.linha.estoque / a.demandaDia - b.linha.estoque / b.demandaDia);
    // Quem tem lote perto de vencer sai primeiro: a transferência vira escoamento.
    const origens = grupo
      .filter((b) => b.sobra > 0 && (b.diasParaVencer === null || b.diasParaVencer > 0))
      .sort((a, b) => b.unidadesEmRisco - a.unidadesEmRisco || b.sobra - a.sobra);
    for (const destino of destinos) {
      for (const origem of origens) {
        if (destino.necessidade <= 0) break;
        if (origem.sobra <= 0 || origem.linha.filial === destino.linha.filial) continue;
        let quantidade = Math.min(origem.sobra, destino.necessidade);
        // Não manda para outra loja o que ela também não vende antes de vencer.
        if (origem.diasParaVencer !== null) {
          const vendeAteVencer = Math.floor(destino.demandaDia * origem.diasParaVencer);
          const jaTem = destino.linha.estoque + destino.linha.emTransito + destino.recebe;
          quantidade = Math.min(quantidade, Math.max(0, vendeAteVencer - jaTem));
        }
        if (quantidade < Math.max(1, p.transferenciaMinima)) continue;
        origem.sobra -= quantidade;
        origem.envia += quantidade;
        origem.unidadesEmRisco = Math.max(0, origem.unidadesEmRisco - quantidade);
        destino.necessidade -= quantidade;
        destino.recebe += quantidade;
        transferencias.push({
          id: `tr:${sku}:${origem.linha.filial}>${destino.linha.filial}`,
          sku,
          produto: destino.linha.produto,
          de: origem.linha.filial,
          para: destino.linha.filial,
          quantidade,
          escoaValidade:
            origem.diasParaVencer !== null && origem.diasParaVencer <= p.horizonteValidadeDias,
          coberturaDestinoDias:
            destino.demandaDia > 0 ? Math.floor(destino.linha.estoque / destino.demandaDia) : null,
          prazoDestinoDias: destino.linha.prazoEntregaDias,
          sobraOrigem: origem.sobra + quantidade,
        });
      }
    }
  }

  // 3. Status de cada item, do mais grave para o mais leve.
  const itens: ItemAnalisado[] = base.map((b) => {
    const l = b.linha;
    const coberturaDias = b.demandaDia > 0 ? l.estoque / b.demandaDia : null;
    // Excesso olha o que fica depois de mandar para as outras filiais.
    const ficaDias = b.demandaDia > 0 ? (l.estoque - b.envia) / b.demandaDia : null;
    const ruptura = b.demandaDia > 0 && l.estoque < b.demandaDia * l.prazoEntregaDias;
    let status: StatusItem = "ok";
    if (b.diasParaVencer !== null && b.diasParaVencer < 0 && l.estoque > 0) status = "vencido";
    else if (ruptura && b.necessidade + b.recebe > 0) status = "ruptura";
    else if (b.unidadesEmRisco > 0) status = "validade";
    else if (b.necessidade > 0 || b.recebe > 0) status = "repor";
    else if (
      l.estoque - b.envia > 0 &&
      (ficaDias === null || ficaDias > 2 * (l.prazoEntregaDias + p.cicloDias + p.diasSeguranca))
    )
      status = "excesso";
    return {
      ...l,
      chave: b.chave,
      demandaDia: arred(b.demandaDia),
      coberturaDias: coberturaDias === null ? null : Math.floor(coberturaDias),
      pontoPedido: Math.ceil(b.pontoPedido),
      alvo: Math.ceil(b.alvo),
      sugestaoCompra: b.necessidade,
      recebeTransferencia: b.recebe,
      enviaTransferencia: b.envia,
      diasParaVencer: b.diasParaVencer,
      unidadesEmRisco: b.unidadesEmRisco,
      status,
    };
  });

  // 4. Decisões: o que a pessoa precisa aprovar, com motivo e valor.
  const decisoes: Decisao[] = [];
  const porChave = new Map(itens.map((i) => [i.chave, i]));
  const exige = (valor: number | null) => valor !== null && valor > p.alcadaGerente;

  for (const i of itens) {
    if (i.status !== "vencido") continue;
    const valor = i.custoUnitario === null ? null : arred(i.custoUnitario * i.estoque);
    decisoes.push({
      id: `venc:${i.chave}`,
      tipo: "vencido",
      prioridade: 1,
      filial: i.filial,
      filiais: [i.filial],
      titulo: `${i.produto}: lote vencido na gôndola`,
      motivo: `${un(i.estoque)} com validade em ${formatarData(i.validade!)}, vencido há ${dias(-i.diasParaVencer!)}.`,
      acao: "Segregar o lote hoje e registrar baixa ou devolução conforme a regra do fornecedor.",
      valor,
      exigeProprietario: exige(valor),
      linhas: [{ sku: i.sku, produto: i.produto, quantidade: i.estoque }],
    });
  }

  for (const t of transferencias) {
    const destino = porChave.get(`${t.para}::${t.sku}`)!;
    decisoes.push({
      id: t.id,
      tipo: "transferencia",
      prioridade: destino.status === "ruptura" ? 1 : 2,
      filial: t.para,
      filiais: [t.para, t.de],
      titulo: `Transferir ${un(t.quantidade)} de ${t.produto}`,
      motivo:
        (t.coberturaDestinoDias === null
          ? `A filial ${t.para} está abaixo do ponto de pedido.`
          : t.coberturaDestinoDias === 0
            ? `O saldo da filial ${t.para} não chega a amanhã e a reposição leva ${dias(t.prazoDestinoDias)}.`
            : `O saldo da filial ${t.para} dura cerca de ${dias(t.coberturaDestinoDias)} e a reposição leva ${dias(t.prazoDestinoDias)}.`) +
        ` A filial ${t.de} tem ${un(t.sobraOrigem)} acima da necessidade estimada` +
        (t.escoaValidade ? ", de um lote perto de vencer que gira mais rápido no destino." : "."),
      acao: `Separar na filial ${t.de} e enviar para a ${t.para}, sem compra nova.`,
      valor: null,
      exigeProprietario: false,
      linhas: [{ sku: t.sku, produto: t.produto, quantidade: t.quantidade }],
    });
  }

  // Compras agrupadas como pedido: uma filial, um fornecedor.
  const pedidos = new Map<string, ItemAnalisado[]>();
  for (const i of itens) {
    if (i.sugestaoCompra <= 0) continue;
    const k = `${i.filial}::${i.fornecedor ?? "Fornecedor a definir"}`;
    pedidos.set(k, [...(pedidos.get(k) ?? []), i]);
  }
  for (const [k, grupo] of pedidos) {
    const [filial, fornecedor] = k.split("::");
    const semCusto = grupo.some((i) => i.custoUnitario === null);
    const valor = semCusto
      ? null
      : arred(grupo.reduce((s, i) => s + i.sugestaoCompra * (i.custoUnitario ?? 0), 0));
    const urgentes = grupo.filter((i) => i.status === "ruptura").length;
    const unidades = grupo.reduce((s, i) => s + i.sugestaoCompra, 0);
    decisoes.push({
      id: `ped:${k}`,
      tipo: "pedido",
      prioridade: urgentes > 0 ? 1 : 2,
      filial,
      filiais: [filial],
      titulo: `Pedido preparado · ${fornecedor}`,
      motivo:
        `${plural(grupo.length, "item", "itens")} abaixo do ponto de pedido, ${un(unidades)} no total` +
        (urgentes > 0
          ? `; ${urgentes === 1 ? "1 pode faltar" : `${urgentes} podem faltar`} antes da entrega.`
          : ".") +
        " O saldo das outras filiais já foi descontado.",
      acao: "Revisar quantidades e enviar ao fornecedor.",
      valor,
      exigeProprietario: exige(valor),
      linhas: grupo.map((i) => ({ sku: i.sku, produto: i.produto, quantidade: i.sugestaoCompra })),
    });
  }

  for (const i of itens) {
    if (i.status === "vencido" || i.unidadesEmRisco <= 0) continue;
    const valor = i.custoUnitario === null ? null : arred(i.custoUnitario * i.unidadesEmRisco);
    decisoes.push({
      id: `val:${i.chave}`,
      tipo: "validade",
      prioridade: (i.diasParaVencer ?? 999) <= 30 ? 1 : (i.diasParaVencer ?? 999) <= 60 ? 2 : 3,
      filial: i.filial,
      filiais: [i.filial],
      titulo: `${i.produto}: ${un(i.unidadesEmRisco)} podem vencer antes de vender`,
      motivo: `O lote vence em ${dias(i.diasParaVencer ?? 0)}; no ritmo atual a filial vende cerca de ${un(
        Math.floor(i.demandaDia * (i.diasParaVencer ?? 0)),
      )} até lá.`,
      acao: "Negociar troca ou devolução com o fornecedor, ou planejar ação de giro.",
      valor,
      exigeProprietario: exige(valor),
      linhas: [{ sku: i.sku, produto: i.produto, quantidade: i.unidadesEmRisco }],
    });
  }

  const ordemTipo: Record<TipoDecisao, number> = {
    vencido: 0,
    transferencia: 1,
    pedido: 2,
    validade: 3,
  };
  decisoes.sort(
    (a, b) =>
      a.prioridade - b.prioridade ||
      ordemTipo[a.tipo] - ordemTipo[b.tipo] ||
      (b.valor ?? 0) - (a.valor ?? 0),
  );

  const compraValor = itens.reduce((s, i) => s + i.sugestaoCompra * (i.custoUnitario ?? 0), 0);
  const valorEmRisco = itens.reduce((s, i) => s + i.unidadesEmRisco * (i.custoUnitario ?? 0), 0);
  return {
    itens,
    transferencias,
    decisoes,
    totais: {
      itens: itens.length,
      filiais: new Set(itens.map((i) => i.filial)).size,
      rupturas: itens.filter((i) => i.status === "ruptura").length,
      compraUnidades: itens.reduce((s, i) => s + i.sugestaoCompra, 0),
      compraValor: arred(compraValor),
      transferenciaUnidades: transferencias.reduce((s, t) => s + t.quantidade, 0),
      unidadesEmRisco: itens.reduce((s, i) => s + i.unidadesEmRisco, 0),
      valorEmRisco: arred(valorEmRisco),
      decisoesProprietario: decisoes.filter((d) => d.exigeProprietario).length,
    },
  };
}

/* ------------------------------------------------------------ planilha */

export const COLUNAS_MODELO = [
  "filial",
  "sku",
  "produto",
  "estoque",
  "vendas_30d",
  "em_transito",
  "prazo_entrega_dias",
  "validade",
  "custo_unitario",
  "fornecedor",
] as const;

type Coluna = (typeof COLUNAS_MODELO)[number];

const APELIDOS: Record<string, Coluna> = {
  filial: "filial",
  loja: "filial",
  unidade: "filial",
  sku: "sku",
  codigo: "sku",
  cod: "sku",
  ean: "sku",
  codigo_de_barras: "sku",
  produto: "produto",
  descricao: "produto",
  item: "produto",
  estoque: "estoque",
  saldo: "estoque",
  estoque_atual: "estoque",
  vendas_30d: "vendas_30d",
  vendas_30_dias: "vendas_30d",
  venda_30d: "vendas_30d",
  vendas: "vendas_30d",
  em_transito: "em_transito",
  transito: "em_transito",
  pedido_em_transito: "em_transito",
  prazo_entrega_dias: "prazo_entrega_dias",
  prazo_entrega: "prazo_entrega_dias",
  prazo: "prazo_entrega_dias",
  lead_time: "prazo_entrega_dias",
  validade: "validade",
  vencimento: "validade",
  custo_unitario: "custo_unitario",
  custo: "custo_unitario",
  preco_custo: "custo_unitario",
  fornecedor: "fornecedor",
  distribuidora: "fornecedor",
};

export const LIMITE_LINHAS = 5000;

export type ResultadoLeitura = {
  linhas: LinhaEstoque[];
  erros: { linha: number; motivo: string }[];
  colunasIgnoradas: string[];
};

function normalizarCabecalho(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function dividir(linha: string, sep: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (aspas) {
      if (c === '"' && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else if (c === '"') aspas = false;
      else atual += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) {
      campos.push(atual);
      atual = "";
    } else atual += c;
  }
  campos.push(atual);
  return campos.map((c) => c.trim());
}

/** Aceita 1.234,5 e 1.200 (Brasil) e 1234.5. Vazio vira null. */
export function lerNumero(bruto: string): number | null {
  const s = bruto.replace(/\s|R\$/g, "");
  if (s === "") return null;
  // Ponto separando grupos de três dígitos é milhar: "1.200" são mil e duzentas unidades.
  const milhar = /^-?\d{1,3}(\.\d{3})+$/.test(s);
  const normal = s.includes(",") || milhar ? s.replace(/\./g, "").replace(",", ".") : s;
  if (!/^-?\d+(\.\d+)?$/.test(normal)) return NaN;
  return Number(normal);
}

/** Aceita AAAA-MM-DD, DD/MM/AAAA e MM/AAAA (vale o último dia do mês). */
export function lerData(bruto: string): string | null | undefined {
  const s = bruto.trim();
  if (s === "") return null;
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return diaUTC(s) === null ? undefined : s;
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) {
    const iso = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return diaUTC(iso) === null ? undefined : iso;
  }
  m = /^(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) {
    const mes = Number(m[1]);
    if (mes < 1 || mes > 12) return undefined;
    const ultimo = new Date(Date.UTC(Number(m[2]), mes, 0)).getUTCDate();
    return `${m[2]}-${String(mes).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;
  }
  return undefined;
}

export function lerPlanilha(texto: string, prazoPadraoDias = 3): ResultadoLeitura {
  const brutas = texto.replace(/^\uFEFF/, "").split(/\r?\n/);
  const erros: ResultadoLeitura["erros"] = [];
  const idxCab = brutas.findIndex((l) => l.trim() !== "");
  if (idxCab < 0)
    return { linhas: [], erros: [{ linha: 1, motivo: "Arquivo vazio." }], colunasIgnoradas: [] };

  const cab = brutas[idxCab];
  const sep = [";", "\t", ","].reduce((melhor, s) =>
    cab.split(s).length > cab.split(melhor).length ? s : melhor,
  );
  const nomes = dividir(cab, sep).map(normalizarCabecalho);
  const mapa = new Map<Coluna, number>();
  const colunasIgnoradas: string[] = [];
  nomes.forEach((n, i) => {
    const col = APELIDOS[n];
    if (col && !mapa.has(col)) mapa.set(col, i);
    else if (n) colunasIgnoradas.push(n);
  });

  const faltando = (["filial", "estoque", "vendas_30d"] as Coluna[]).filter((c) => !mapa.has(c));
  if (!mapa.has("sku") && !mapa.has("produto")) faltando.push("sku");
  if (faltando.length) {
    return {
      linhas: [],
      erros: [{ linha: idxCab + 1, motivo: `Coluna obrigatória ausente: ${faltando.join(", ")}.` }],
      colunasIgnoradas,
    };
  }

  const linhas: LinhaEstoque[] = [];
  const vistas = new Set<string>();
  for (let i = idxCab + 1; i < brutas.length; i++) {
    if (brutas[i].trim() === "") continue;
    const n = i + 1;
    if (linhas.length >= LIMITE_LINHAS) {
      erros.push({ linha: n, motivo: `Limite de ${LIMITE_LINHAS} linhas por análise atingido.` });
      break;
    }
    const campos = dividir(brutas[i], sep);
    const v = (c: Coluna) => (mapa.has(c) ? (campos[mapa.get(c)!] ?? "") : "");
    const filial = v("filial");
    const sku = v("sku") || v("produto");
    if (!filial || !sku) {
      erros.push({ linha: n, motivo: "Filial ou SKU vazio." });
      continue;
    }
    const estoque = lerNumero(v("estoque"));
    const vendas = lerNumero(v("vendas_30d"));
    const transito = lerNumero(v("em_transito"));
    const prazo = lerNumero(v("prazo_entrega_dias"));
    const custo = lerNumero(v("custo_unitario"));
    const validade = lerData(v("validade"));
    const invalido = (x: number | null) => x !== null && (Number.isNaN(x) || x < 0);
    if (estoque === null || vendas === null || invalido(estoque) || invalido(vendas)) {
      erros.push({
        linha: n,
        motivo: "Estoque e vendas_30d precisam ser números a partir de zero.",
      });
      continue;
    }
    if (invalido(transito) || invalido(prazo) || invalido(custo)) {
      erros.push({
        linha: n,
        motivo: "em_transito, prazo e custo precisam ser números a partir de zero.",
      });
      continue;
    }
    if (validade === undefined) {
      erros.push({ linha: n, motivo: `Validade "${v("validade")}" não reconhecida.` });
      continue;
    }
    const chave = `${filial}::${sku}`;
    if (vistas.has(chave)) {
      erros.push({
        linha: n,
        motivo: `${sku} aparece duas vezes em ${filial}; some os saldos numa linha.`,
      });
      continue;
    }
    vistas.add(chave);
    linhas.push({
      filial,
      sku,
      produto: v("produto") || sku,
      estoque: estoque!,
      vendas30d: vendas!,
      emTransito: transito ?? 0,
      prazoEntregaDias: prazo ?? prazoPadraoDias,
      validade,
      custoUnitario: custo,
      fornecedor: v("fornecedor") || null,
    });
  }
  return { linhas, erros, colunasIgnoradas };
}

export function paraPlanilha(linhas: LinhaEstoque[]): string {
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const num = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));
  const corpo = linhas.map((l) =>
    [
      esc(l.filial),
      esc(l.sku),
      esc(l.produto),
      num(l.estoque),
      num(l.vendas30d),
      num(l.emTransito),
      num(l.prazoEntregaDias),
      l.validade ?? "",
      num(l.custoUnitario),
      esc(l.fornecedor ?? ""),
    ].join(";"),
  );
  return [COLUNAS_MODELO.join(";"), ...corpo].join("\n") + "\n";
}

/* ------------------------------------------------------------ formatos */

export function formatarData(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export function formatarBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
