/**
 * Cenário demonstrativo da Veronica Pharma: uma rede fictícia de três
 * filiais. Nomes de filial e de fornecedor são inventados; os produtos usam
 * nome genérico, sem marca. Nenhum número aqui é resultado de cliente.
 *
 * As validades são relativas a "hoje" para o cenário não envelhecer: quem
 * abre a página em qualquer dia vê o mesmo enredo — uma ruptura resolvida
 * com transferência, um lote escoado para a filial que gira mais, um lote
 * vencido, pedidos por fornecedor e um pedido acima da alçada do gerente.
 */

import { somarDias, type LinhaEstoque } from "./engine.ts";

type Produto = {
  sku: string;
  produto: string;
  fornecedor: string;
  custo: number;
  prazo: number;
};

const PRODUTOS: Produto[] = [
  {
    sku: "DIP500",
    produto: "Dipirona 500 mg · 10 comp.",
    fornecedor: "Distribuidora Alfa",
    custo: 3.2,
    prazo: 2,
  },
  {
    sku: "LOS50",
    produto: "Losartana 50 mg · 30 comp.",
    fornecedor: "Distribuidora Alfa",
    custo: 6.9,
    prazo: 2,
  },
  {
    sku: "OME20",
    produto: "Omeprazol 20 mg · 28 cáps.",
    fornecedor: "Distribuidora Beta",
    custo: 8.4,
    prazo: 3,
  },
  {
    sku: "PAR750",
    produto: "Paracetamol 750 mg · 20 comp.",
    fornecedor: "Distribuidora Alfa",
    custo: 4.1,
    prazo: 2,
  },
  {
    sku: "VITC1G",
    produto: "Vitamina C 1 g · 10 efervesc.",
    fornecedor: "Distribuidora Beta",
    custo: 9.8,
    prazo: 3,
  },
  {
    sku: "PROT50",
    produto: "Protetor solar FPS 50 · 120 mL",
    fornecedor: "Indústria Gama",
    custo: 38.5,
    prazo: 7,
  },
  {
    sku: "FRALG",
    produto: "Fralda infantil G · 32 un.",
    fornecedor: "Indústria Gama",
    custo: 42.9,
    prazo: 7,
  },
  {
    sku: "IBU400",
    produto: "Ibuprofeno 400 mg · 10 cáps.",
    fornecedor: "Distribuidora Alfa",
    custo: 5.6,
    prazo: 2,
  },
  {
    sku: "MET850",
    produto: "Metformina 850 mg · 30 comp.",
    fornecedor: "Distribuidora Beta",
    custo: 7.3,
    prazo: 3,
  },
  {
    sku: "LOR10",
    produto: "Loratadina 10 mg · 12 comp.",
    fornecedor: "Distribuidora Beta",
    custo: 6.2,
    prazo: 3,
  },
  {
    sku: "SORO500",
    produto: "Soro fisiológico 0,9% · 500 mL",
    fornecedor: "Distribuidora Alfa",
    custo: 5.9,
    prazo: 2,
  },
  {
    sku: "TERMO",
    produto: "Termômetro digital",
    fornecedor: "Indústria Gama",
    custo: 24,
    prazo: 7,
  },
];

export const FILIAIS_DEMO = ["Centro", "Norte", "Sul"] as const;

/** [estoque, vendas 30 dias, em trânsito, validade em dias a partir de hoje] */
type Saldo = [number, number, number, number | null];

const SALDOS: Record<(typeof FILIAIS_DEMO)[number], Record<string, Saldo>> = {
  Centro: {
    DIP500: [140, 300, 0, 300],
    LOS50: [5, 90, 0, 400],
    OME20: [30, 120, 0, 380],
    PAR750: [60, 150, 50, 420],
    VITC1G: [25, 45, 0, 200],
    PROT50: [4, 60, 0, 300],
    FRALG: [10, 150, 0, null],
    IBU400: [50, 60, 0, 360],
    MET850: [90, 75, 0, 500],
    LOR10: [12, 30, 0, 250],
    SORO500: [20, 60, 0, 330],
    TERMO: [8, 9, 0, null],
  },
  Norte: {
    DIP500: [30, 150, 0, 310],
    LOS50: [80, 24, 0, 400],
    OME20: [28, 45, 0, 350],
    PAR750: [18, 90, 0, 400],
    VITC1G: [4, 30, 0, -3],
    PROT50: [12, 15, 0, 200],
    FRALG: [40, 60, 0, null],
    IBU400: [30, 45, 0, 340],
    MET850: [35, 60, 0, 500],
    LOR10: [60, 6, 0, 75],
    SORO500: [25, 30, 0, 300],
    TERMO: [5, 6, 0, null],
  },
  Sul: {
    DIP500: [260, 90, 0, 280],
    LOS50: [25, 30, 0, 390],
    OME20: [10, 60, 0, 360],
    PAR750: [40, 45, 0, 410],
    VITC1G: [20, 24, 0, 120],
    PROT50: [46, 6, 0, 45],
    FRALG: [30, 45, 0, null],
    IBU400: [8, 36, 0, 330],
    MET850: [40, 30, 0, 480],
    LOR10: [15, 12, 0, 260],
    SORO500: [6, 45, 0, 310],
    TERMO: [20, 3, 0, null],
  },
};

export function linhasDemonstrativas(hoje: string): LinhaEstoque[] {
  return FILIAIS_DEMO.flatMap((filial) =>
    PRODUTOS.map((p) => {
      const [estoque, vendas30d, emTransito, validade] = SALDOS[filial][p.sku];
      return {
        filial,
        sku: p.sku,
        produto: p.produto,
        estoque,
        vendas30d,
        emTransito,
        prazoEntregaDias: p.prazo,
        validade: validade === null ? null : somarDias(hoje, validade),
        custoUnitario: p.custo,
        fornecedor: p.fornecedor,
      };
    }),
  );
}
