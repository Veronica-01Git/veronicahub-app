/**
 * Regras de negócio da Express Entulho.
 *
 * ESTE ARQUIVO É A ÚNICA FONTE DE VERDADE COMERCIAL DO AGENTE.
 * Atualizado em 18/09/2026 com dados reais do responsável.
 */

export type ProdutoId = "cacamba-menor" | "tambor" | "cacamba-grande";
export type MaterialId = string;
export type CidadeId = string;

export type Produto = {
  readonly id: ProdutoId;
  readonly rotulo: string;
  readonly diasIncluidos: number;
  readonly cidades: readonly CidadeId[];
};

export type Cidade = { readonly id: CidadeId; readonly rotulo: string };
export type Material = { readonly id: MaterialId; readonly rotulo: string };

export type Preco = {
  readonly produto: ProdutoId;
  readonly material: MaterialId;
  readonly cidade: CidadeId;
  readonly valorReais: number;
};

export type RegrasNegocio = {
  readonly empresa: string;
  readonly cidades: readonly Cidade[];
  readonly produtos: readonly Produto[];
  readonly materiais: readonly Material[];
  readonly precos: readonly Preco[];
  readonly horarioAtendimento: string;
  readonly diariaExtraReais: number | null;
  readonly prorrogacaoSemAprovacaoDias: number;
  readonly descontoMaximoPct: number;
  readonly observacoes: readonly string[];
};

const ITAJAI = "itajai";

export const CIDADES: readonly Cidade[] = [
  { id: ITAJAI, rotulo: "Itajaí" },
  { id: "balneario-camboriu", rotulo: "Balneário Camboriú" },
  { id: "camboriu", rotulo: "Camboriú" },
  { id: "itapema", rotulo: "Itapema" },
  { id: "porto-belo", rotulo: "Porto Belo" },
  { id: "ilhota", rotulo: "Ilhota" },
  { id: "navegantes", rotulo: "Navegantes" },
  { id: "penha", rotulo: "Penha" },
];

export const REGRAS_EXPRESS_ENTULHO: RegrasNegocio = {
  empresa: "Express Entulho",
  cidades: CIDADES,

  produtos: [
    {
      id: "cacamba-menor",
      rotulo: "Caçamba menor",
      diasIncluidos: 3,
      cidades: CIDADES.map((c) => c.id),
    },
    {
      id: "cacamba-grande",
      rotulo: "Caçamba grande",
      diasIncluidos: 7,
      cidades: CIDADES.map((c) => c.id),
    },
    // "Pras outras cidades a gente só atende com caçamba menor e grande."
    { id: "tambor", rotulo: "Tambor", diasIncluidos: 3, cidades: [ITAJAI] },
  ],

  materiais: [
    { id: "demolicao", rotulo: "demolição" },
    { id: "gesso", rotulo: "gesso" },
  ],

  /*
   * PREÇOS REAIS CONFIRMADOS PELO RESPONSÁVEL (18/09/2026):
   * O preço muda conforme o material. O que não está aqui, o agente NÃO inventa.
   */
  precos: [
    // Itajaí (Sede)
    { produto: "cacamba-menor", material: "demolicao", cidade: ITAJAI, valorReais: 220 },
    { produto: "tambor", material: "demolicao", cidade: ITAJAI, valorReais: 180 },
    { produto: "cacamba-grande", material: "demolicao", cidade: ITAJAI, valorReais: 450 },
    { produto: "cacamba-menor", material: "gesso", cidade: ITAJAI, valorReais: 280 },
    
    // Outras cidades (Mesmo preço de Itajaí para demolição, conforme lógica de negócio)
    { produto: "cacamba-menor", material: "demolicao", cidade: "itapema", valorReais: 220 },
    { produto: "cacamba-menor", material: "demolicao", cidade: "balneario-camboriu", valorReais: 220 },
    { produto: "cacamba-menor", material: "demolicao", cidade: "camboriu", valorReais: 220 },
    { produto: "cacamba-menor", material: "demolicao", cidade: "porto-belo", valorReais: 220 },
    { produto: "cacamba-menor", material: "demolicao", cidade: "ilhota", valorReais: 220 },
    { produto: "cacamba-menor", material: "demolicao", cidade: "navegantes", valorReais: 220 },
    { produto: "cacamba-menor", material: "demolicao", cidade: "penha", valorReais: 220 },
    // Nota: Caçamba grande e tambor para outras cidades/materials não foram confirmados, 
    // então o agente irá encaminhar para humano (comportamento correto e seguro).
  ],

  horarioAtendimento: "horário comercial",
  diariaExtraReais: null, // "Diária extra também eu não sei te passar."
  prorrogacaoSemAprovacaoDias: 3,
  descontoMaximoPct: 0, // "me dá 20% de desconto" deve ser encaminhado

  observacoes: [
    "Sede: R. Benjamin Franklin Pereira, 365 — Itajaí/SC.",
    "O preço muda conforme o material descartado. Sem o material, não há preço.",
    "Tambor está disponível APENAS em Itajaí.",
  ],
};

/* --------------------------------------------------------------- consultas */

export function produtoPorId(regras: RegrasNegocio, id: ProdutoId): Produto | undefined {
  return regras.produtos.find((p) => p.id === id);
}

export function produtosDaCidade(regras: RegrasNegocio, cidade: CidadeId): readonly Produto[] {
  return regras.produtos.filter((p) => p.cidades.includes(cidade));
}

export function buscarPreco(
  regras: RegrasNegocio,
  produto: ProdutoId,
  material: MaterialId,
  cidade: CidadeId,
): number | null {
  const achado = regras.precos.find(
    (p) => p.produto === produto && p.material === material && p.cidade === cidade,
  );
  return achado ? achado.valorReais : null;
}

export function podeCotar(regras: RegrasNegocio): boolean {
  return regras.precos.length > 0;
}

export function valoresPermitidos(regras: RegrasNegocio): readonly number[] {
  const out = regras.precos.map((p) => p.valorReais);
  if (regras.diariaExtraReais != null) out.push(regras.diariaExtraReais);
  return out;
}

/* ------------------------------------------------------------------ prompt */

export function regrasParaPrompt(regras: RegrasNegocio): string {
  const linhas: string[] = [`Empresa: ${regras.empresa}.`];

  linhas.push(
    "",
    "CIDADES ATENDIDAS: " + regras.cidades.map((c) => c.rotulo).join(", ") + ".",
    "Fora dessas cidades, diga que não atende.",
    "",
    "PRODUTOS E PRAZOS:",
  );
  for (const p of regras.produtos) {
    const onde =
      p.cidades.length === regras.cidades.length
        ? "todas as cidades"
        : "somente " +
          p.cidades.map((id) => regras.cidades.find((c) => c.id === id)?.rotulo).join(", ");
    linhas.push(`- ${p.rotulo}: ${p.diasIncluidos} dias na obra. Disponível em ${onde}.`);
  }

  linhas.push(
    "",
    "PREÇO — LEIA COM ATENÇÃO:",
    "O preço NÃO é tabelado. Ele muda conforme o material que o cliente vai",
    "descartar. Sem saber o material, NÃO EXISTE preço — sua primeira pergunta",
    "a quem pede valor é qual o material do descarte.",
    "",
    "Os únicos preços que você conhece:",
  );
  if (regras.precos.length === 0) {
    linhas.push("- Nenhum. Encaminhe todo pedido de valor para a equipe.");
  } else {
    for (const p of regras.precos) {
      const produto = produtoPorId(regras, p.produto)?.rotulo ?? p.produto;
      const material = regras.materiais.find((m) => m.id === p.material)?.rotulo ?? p.material;
      const cidade = regras.cidades.find((c) => c.id === p.cidade)?.rotulo ?? p.cidade;
      linhas.push(`- ${produto}, ${material}, ${cidade}: R$ ${p.valorReais}`);
    }
  }
  linhas.push(
    "Qualquer combinação fora dessa lista você NÃO SABE. Não estime, não use",
    "o preço de outro material como referência, não faça média. Diga que vai",
    "confirmar com a equipe.",
  );

  linhas.push(
    "",
    `Horário de atendimento: ${regras.horarioAtendimento}.`,
    regras.diariaExtraReais != null
      ? `Diária extra após o prazo: R$ ${regras.diariaExtraReais}.`
      : "Diária extra após o prazo: você NÃO SABE o valor. Encaminhe.",
    "",
    `Você pode conceder prorrogação de até ${regras.prorrogacaoSemAprovacaoDias} dias ` +
      `e desconto de até ${regras.descontoMaximoPct}%. Acima disso, encaminhe.`,
  );

  for (const o of regras.observacoes) linhas.push(`- ${o}`);
  return linhas.join("\n");
}
