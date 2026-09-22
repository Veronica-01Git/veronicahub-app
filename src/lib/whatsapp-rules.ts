/**
 * Regras de negócio da Express Entulho.
 *
 * ESTE ARQUIVO É A ÚNICA FONTE DE VERDADE COMERCIAL DO AGENTE.
 *
 * O ACHADO QUE ORGANIZA TUDO AQUI: **não existe tabela de preço fixa**. O
 * preço é referente ao material que o cliente vai descartar. Demolição e
 * gesso custam diferente no mesmo produto, na mesma cidade.
 *
 * Consequência prática: o agente NÃO PODE COTAR SEM SABER O MATERIAL. É a
 * primeira pergunta dele, sempre — como é a primeira do dono no WhatsApp.
 *
 * AS DUAS FONTES, E ELAS NÃO VALEM O MESMO:
 *
 * 1. **O dono, em conversa real com cliente (19/09).** Autoridade máxima. É
 *    dele o preço de Itapema e é dele o jeito de atender que o agente imita.
 * 2. **Um áudio de um vendedor que está saindo da empresa (16/09).** Foi de
 *    onde nasceu a tabela de Itajaí. Vale como indício, não como palavra
 *    final — inclusive porque ele mesmo diz "não sou vendedor, vendedor não
 *    é eu" antes de não saber vários valores. **Tudo que vier só dele deve
 *    ser reconfirmado com o dono.**
 *
 * REGRA DE PROCEDÊNCIA: **nada entra aqui sem fonte**, e cada preço abaixo
 * carrega a sua. Onde as duas fontes divergirem, vale o dono.
 *
 * Em 18/09 entraram dezesseis preços sem fonte nenhuma: gesso no tambor (230)
 * e na grande (550) em Itajaí, e demolição nas outras sete cidades a 220 e
 * 450. Saíram em 19/09. Sobre os dois de gesso, a única pessoa que falou do
 * assunto disse não saber o valor. Sobre as outras cidades, o que foi dito é
 * que **o prazo** é o mesmo — nunca que o preço é. E a conversa do dono
 * desmente a suposição de tabela única: em Itapema ele cota gesso na menor a
 * R$ 250, enquanto em Itajaí a mesma combinação é R$ 280. Cidade diferente,
 * preço diferente, e **mais barato fora da sede** — nem tabela igual, nem
 * acréscimo por deslocamento.
 *
 * Por que isso importa mais do que parece: a guarda de preço, em
 * whatsapp-agent.ts, confere se o valor **está nesta matriz**. Ela não tem
 * como conferir se a matriz está certa. Um número errado aqui é um número que
 * o agente repete com confiança total para cliente real.
 *
 * DÚVIDAS ABERTAS, as três para o dono:
 * - Os valores de Itajaí vieram do vendedor que está saindo. Conferir.
 * - Ao recusar desconto, o dono menciona "reajuste de preço no aterro".
 *   Confirmar se a tabela de Itajaí subiu depois disso.
 * - O tambor custa 180 com demolição e 180 com entulho. Tem preço único,
 *   independente do material? Se tiver, o tambor sai da lógica de matriz.
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
  /** Prazos que o dono pratica e diz ao cliente sem consultar ninguém. */
  readonly prazoEntregaHoras: number;
  readonly prazoRecolhaHoras: number;
  /** Trocar caçamba cheia por vazia é uma locação nova, e é cobrada como tal. */
  readonly trocaEhNovaLocacao: boolean;
  /** A recolha só é aberta depois do comprovante de pagamento. */
  readonly comprovanteAntesDaRecolha: boolean;
  readonly dadosParaAgendar: readonly string[];
  readonly formasPagamento: readonly string[];
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
    { id: "tambor", rotulo: "Tambor", diasIncluidos: 3, cidades: [ITAJAI] },
  ],

  /*
   * A lista que o próprio DONO dita ao cliente no WhatsApp, quando
   * pergunta o que vai ser descartado: "entulho de obra, móveis, terra,
   * telhas, madeira, mdf, gesso, vidro, poda".
   *
   * Estar aqui é o agente RECONHECER a palavra, não saber o preço dela. Sem
   * preço cadastrado, ele encaminha — que é o comportamento certo e o que o
   * dono faz quando não sabe. "demolição" entra por ser o material da tabela
   * de Itajaí.
   */
  materiais: [
    { id: "demolicao", rotulo: "demolição" },
    { id: "gesso", rotulo: "gesso" },
    { id: "entulho", rotulo: "entulho" },
    { id: "moveis", rotulo: "móveis" },
    { id: "terra", rotulo: "terra" },
    { id: "telhas", rotulo: "telhas" },
    { id: "madeira", rotulo: "madeira" },
    { id: "mdf", rotulo: "mdf" },
    { id: "vidro", rotulo: "vidro" },
    { id: "poda", rotulo: "poda" },
  ],

  /*
   * Só o que tem fonte primária. Nada aqui é inferido, e a procedência de
   * cada linha está ao lado dela.
   *
   * NÃO CADASTRADO, portanto encaminhado: gesso no tambor e na caçamba grande
   * (quem falou do assunto não soube dizer), a menor em Itapema com material
   * que não seja gesso, tudo nas outras seis cidades, e todos os oito
   * materiais fora demolição e gesso.
   *
   * Uma conversa de 14/09 mostrou "caçamba menor, 240 reais" — que não bate
   * com nada abaixo. Não entrou: é a prova de que inferir por semelhança
   * erraria.
   */
  precos: [
    // Áudio do vendedor que está saindo (16/09): "pra demolição, a caçamba
    // menor pra Itajaí é R$ 220, o tambor é R$ 180 e a grande é R$ 450".
    // FONTE FRACA — reconfirmar com o dono.
    { produto: "cacamba-menor", material: "demolicao", cidade: ITAJAI, valorReais: 220 },
    { produto: "tambor", material: "demolicao", cidade: ITAJAI, valorReais: 180 },
    { produto: "cacamba-grande", material: "demolicao", cidade: ITAJAI, valorReais: 450 },

    // Mesmo áudio: "gesso... então a caçamba menor R$ 280". FONTE FRACA.
    { produto: "cacamba-menor", material: "gesso", cidade: ITAJAI, valorReais: 280 },

    // FONTE FORTE, e de um tipo novo: mensagem que a PRÓPRIA EMPRESA mandou a
    // um cliente pelo WhatsApp dela, em 14/09 às 13:26 — a peça de marketing
    // oficial do tambor com a legenda "Tambor de entulho / 180 reias e fica 3
    // dias". Não é alguém contando de memória o que a empresa cobra; é a
    // empresa cobrando.
    //
    // A CIDADE NÃO APARECE NO PRINT. Ela entra como Itajaí porque o tambor só
    // existe em Itajaí — regra que já estava neste arquivo, não suposição
    // feita agora. Se o tambor passar a rodar em outra cidade, esta linha
    // precisa ser revista antes.
    //
    // Repare que o valor é o MESMO do tambor com demolição (180). Ou o tambor
    // tem preço único independente do material, ou é coincidência. É pergunta
    // para o dono, e está em PENDENCIAS-CLIENTE.md.
    { produto: "tambor", material: "entulho", cidade: ITAJAI, valorReais: 180 },

    // O DONO, em conversa real com cliente (19/09), Itapema, gesso:
    // "CACAMBA MENOR, 250 reais e fica 3 dias" e "Caçamba grande, 470 reais e
    // fica 7 dias". É o único preço fora de Itajaí com fonte, e é ele que
    // mostra que cada cidade tem preço próprio.
    { produto: "cacamba-menor", material: "gesso", cidade: "itapema", valorReais: 250 },
    { produto: "cacamba-grande", material: "gesso", cidade: "itapema", valorReais: 470 },
  ],

  horarioAtendimento: "horário comercial",

  // "Diária extra também eu não sei te passar."
  diariaExtraReais: null,

  prorrogacaoSemAprovacaoDias: 3,

  // O DONO recusa desconto e explica por quê: "não consigo baixar o preço,
  // amigo, pois teve reajuste de preço no aterro". Não há alçada.
  descontoMaximoPct: 0,

  // "Dentro de 4 horas chega no máximo" (entrega e troca) e "para recolher
  // estamos pedindo 24 horas no máximo, pois estamos com uma alta demanda".
  prazoEntregaHoras: 4,
  prazoRecolhaHoras: 24,

  // "Ok, sim, consigo fazer uma nova locação de troca."
  trocaEhNovaLocacao: true,

  // O DONO, mesma conversa (19/09), quando o cliente diz que a caçamba
  // encheu e pergunta se quer recolher: "Perfeito, consegue enviar o
  // comprovante de pagamento para possamos abrir uma ordem de serviço para
  // recolher sua caçamba". O comprovante vem ANTES da ordem de recolha —
  // não é detalhe de cobrança, é o passo que destrava a operação.
  comprovanteAntesDaRecolha: true,

  dadosParaAgendar: ["nome completo", "CPF", "endereço completo com rua, número, bairro e cidade"],

  // Pagamento no ato da entrega ou antes da coleta. A chave Pix de propósito
  // NÃO está aqui: mandar chave de pagamento é dinheiro, e dinheiro é de uma
  // pessoa. O agente diz as formas aceitas e passa a conversa adiante.
  formasPagamento: ["Pix", "dinheiro", "cartão em até 2x com o juro da máquina"],

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

  // Operação: prazos e fluxo que o responsável diz ao cliente sem consultar
  // ninguém. São informação firme, e a agente pode dizer.
  linhas.push(
    "",
    "COMO A OPERAÇÃO FUNCIONA (pode dizer, é firme):",
    `- Entrega e troca chegam em até ${regras.prazoEntregaHoras} horas.`,
    `- Recolha da caçamba cheia: até ${regras.prazoRecolhaHoras} horas.`,
    regras.trocaEhNovaLocacao
      ? "- Troca é uma locação NOVA e é cobrada como tal. Cliente que diz que encheu" +
          "\n  está pedindo troca, e o valor é o da locação daquele produto e material."
      : "- Troca não gera nova cobrança.",
    "- O motorista avisa o cliente quando estiver a caminho da entrega.",
    "",
    "PARA AGENDAR, peça: " + regras.dadosParaAgendar.join(", ") + ".",
    "",
    "PAGAMENTO: no ato da entrega ou antes da coleta. Aceita " +
      regras.formasPagamento.join(", ") +
      ".",
    "Você NÃO envia chave Pix e NÃO confere comprovante — isso é de uma pessoa.",
    'Se o cliente pedir a chave ("manda o Pix"), não enrole e não peça dados:',
    "diga que uma pessoa da equipe manda a chave agora e encaminhe.",
    regras.comprovanteAntesDaRecolha
      ? "RECOLHA: quem pede recolha sem ter pago, você pede o comprovante primeiro —\n" +
          "  é ele que destrava a ordem de serviço. Peça do jeito do dono: diga PARA QUE\n" +
          "  serve, não só que precisa."
      : "RECOLHA: não depende de comprovante.",
    "Se o cliente mandar comprovante, confirme que recebeu, diga que a recolha",
    `sai em até ${regras.prazoRecolhaHoras} horas, e passe para a equipe conferir.`,
  );

  for (const o of regras.observacoes) linhas.push(`- ${o}`);
  return linhas.join("\n");
}
