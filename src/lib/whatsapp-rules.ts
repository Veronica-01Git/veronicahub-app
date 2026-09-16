/**
 * Regras de negócio da Express Entulho.
 *
 * ESTE ARQUIVO É A ÚNICA FONTE DE VERDADE COMERCIAL DO AGENTE.
 *
 * O ACHADO QUE ORGANIZA TUDO AQUI: **não existe tabela de preço fixa**. O
 * responsável da Express foi explícito — "não existe nada fixo, o preço é
 * referente ao material de descarte que o cliente vai descartar". Demolição
 * e gesso custam diferente no mesmo produto, na mesma cidade.
 *
 * Consequência prática: o agente NÃO PODE COTAR SEM SABER O MATERIAL. Essa é
 * a primeira pergunta dele, sempre. E como a matriz está incompleta — o
 * próprio responsável disse "eu não sou vendedor" e não soube vários valores
 * — o que falta é encaminhado a um humano, nunca estimado por semelhança.
 */

export type ProdutoId = "cacamba-menor" | "tambor" | "cacamba-grande";
export type MaterialId = string;
export type CidadeId = string;

export type Produto = {
  readonly id: ProdutoId;
  readonly rotulo: string;
  readonly diasIncluidos: number;
  /** Cidades onde este produto existe. Tambor só em Itajaí. */
  readonly cidades: readonly CidadeId[];
};

export type Cidade = { readonly id: CidadeId; readonly rotulo: string };
export type Material = { readonly id: MaterialId; readonly rotulo: string };

/** Um preço só existe para a combinação produto + material + cidade. */
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
  /** Diária cobrada após o prazo. Ainda desconhecida. */
  readonly diariaExtraReais: number | null;
  readonly prorrogacaoSemAprovacaoDias: number;
  readonly descontoMaximoPct: number;
  readonly observacoes: readonly string[];
};

const ITAJAI = "itajai";

/** Cidades ditas pelo responsável, 16/09/2026. */
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

const FORA_DE_ITAJAI = CIDADES.filter((c) => c.id !== ITAJAI).map((c) => c.id);

export const REGRAS_EXPRESS_ENTULHO: RegrasNegocio = {
  empresa: "Express Entulho",
  cidades: CIDADES,

  produtos: [
    // Prazos confirmados pelo responsável e iguais em todas as cidades.
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
   * Só o que o responsável afirmou. Nada aqui é inferido.
   *
   * NÃO CONFIRMADO, portanto ausente: tambor e caçamba grande com gesso
   * ("eu não sei te passar o valor"), qualquer preço fora de Itajaí, e
   * qualquer material que não seja demolição ou gesso.
   *
   * Uma conversa de 14/09 mostrou "caçamba menor, 240 reais" — valor que não
   * bate com demolição (220) nem com gesso (280). Provavelmente outro
   * material ou negociação pontual. Por isso não entrou: é a prova de que
   * inferir preço por semelhança erraria.
   */
  precos: [
    { produto: "cacamba-menor", material: "demolicao", cidade: ITAJAI, valorReais: 220 },
    { produto: "tambor", material: "demolicao", cidade: ITAJAI, valorReais: 180 },
    { produto: "cacamba-grande", material: "demolicao", cidade: ITAJAI, valorReais: 450 },
    { produto: "cacamba-menor", material: "gesso", cidade: ITAJAI, valorReais: 280 },
  ],

  horarioAtendimento: "horário comercial",

  // "Diária extra também eu não sei te passar."
  diariaExtraReais: null,

  prorrogacaoSemAprovacaoDias: 3,
  descontoMaximoPct: 0,

  observacoes: [
    "Sede: R. Benjamin Franklin Pereira, 365 — Itajaí/SC.",
    "O preço muda conforme o material descartado. Sem o material, não há preço.",
  ],
};

/* --------------------------------------------------------------- consultas */

export function produtoPorId(regras: RegrasNegocio, id: ProdutoId): Produto | undefined {
  return regras.produtos.find((p) => p.id === id);
}

export function produtosDaCidade(regras: RegrasNegocio, cidade: CidadeId): readonly Produto[] {
  return regras.produtos.filter((p) => p.cidades.includes(cidade));
}

/** O preço exato, ou `null` quando essa combinação não foi cadastrada. */
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

/** Há ao menos um preço cadastrado? Porta de entrada para cotar. */
export function podeCotar(regras: RegrasNegocio): boolean {
  return regras.precos.length > 0;
}

/** Todo valor em reais que o agente tem permissão de dizer. */
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
    "PRODUTOS E PRAZOS (prazo é informação firme, pode dizer):",
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
