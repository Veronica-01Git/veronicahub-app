/**
 * Núcleo conversacional do agente.
 *
 * A regra que organiza este arquivo: **o modelo propõe, o código decide**.
 * Prompt é instrução, não garantia — modelo contorna instrução sob pressão do
 * cliente ("me dá um desconto, senão fecho com o concorrente"). Por isso toda
 * resposta passa por uma conferência determinística antes de sair, e qualquer
 * valor em reais que não esteja em whatsapp-rules.ts derruba a resposta.
 *
 * Desfazer uma cotação errada custa a venda e a confiança. Escalar para um
 * humano custa alguns minutos.
 */

import {
  CADEIA_DE_PROVEDORES,
  PROVEDOR_ANTHROPIC,
  PROVEDOR_GROQ,
  type Provedor,
} from "./whatsapp-provedores";
import {
  podeCotar,
  buscarPreco,
  produtoPorId,
  regrasParaPrompt,
  REGRAS_EXPRESS_ENTULHO,
  type CidadeId,
  type MaterialId,
  type ProdutoId,
  type RegrasNegocio,
} from "./whatsapp-rules";

/**
 * Modelo sondado pelo diagnóstico. A cadeia inteira vive em
 * whatsapp-provedores.ts; aqui fica só o nome do principal, que é o que o
 * endpoint /api/whatsapp/diagnostico precisa citar.
 */
export const MODELO_AGENTE = PROVEDOR_ANTHROPIC.modelo;
export const MODELO_RESERVA = PROVEDOR_GROQ.modelo;

export type Turno = { readonly role: "user" | "assistant"; readonly content: string };

export type Decisao = {
  readonly texto: string;
  /** true quando a conversa precisa de um humano antes de prosseguir. */
  readonly escalar: boolean;
  /** Por que escalou. Vai para o log e para o painel, não para o cliente. */
  readonly motivo?: string;
};

const ESCALONAMENTO =
  "Deixa eu confirmar isso com a equipe para não te passar informação errada. " +
  "Uma pessoa daqui te responde em seguida.";

const RECEBIDO_VAI_PARA_HUMANO =
  "Recebi aqui! Já estou passando para uma pessoa da equipe dar sequência.";

const APRESENTACAO =
  "Oi! Aqui é o atendimento da Express Entulho. " +
  "Me conta o que você precisa que eu já encaminho.";

/**
 * Assuntos que são política comercial, não conhecimento. Continuam escalando
 * mesmo depois que a tabela de preços entrar.
 */
const FORA_DA_ALCADA = [
  /desconto/i,
  /\bmulta\b/i,
  /cancel/i,
  /isen(ç|c)(ã|a)o/i,
  /prorrog/i,
  /\bfatur/i,
  /\bboleto\b/i,
  /\bnota fiscal\b/i,
];

export function precisaDeHumano(texto: string): boolean {
  return FORA_DA_ALCADA.some((r) => r.test(texto));
}

/* ------------------------------------------------------- guarda de valores */

const PADRAO_MOEDA =
  /(?:R\$\s*)(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)|(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+)\s*reais/gi;

function paraNumero(bruto: string): number {
  const limpo = bruto.replace(/\./g, "").replace(",", ".");
  return Number.parseFloat(limpo);
}

/** Todo valor em reais citado no texto. */
export function valoresCitados(texto: string): readonly number[] {
  const out: number[] = [];
  for (const m of texto.matchAll(PADRAO_MOEDA)) {
    const bruto = m[1] ?? m[2];
    if (!bruto) continue;
    const n = paraNumero(bruto);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/* ------------------------------------------- o que a conversa já estabeleceu */

/** Sem acento e sem caixa, para comparar o que o cliente digita de verdade. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Cidades citadas no texto. O vocabulário sai das próprias regras, para não
 * existirem duas listas de cidades que possam divergir.
 *
 * Os rótulos mais longos são testados primeiro: "Balneário Camboriú" contém
 * "Camboriú", e reconhecer a cidade errada aqui seria pior que não reconhecer.
 */
export function cidadesCitadas(
  texto: string,
  regras: RegrasNegocio = REGRAS_EXPRESS_ENTULHO,
): readonly CidadeId[] {
  const alvo = normalizar(texto);
  const porTamanho = [...regras.cidades].sort((a, b) => b.rotulo.length - a.rotulo.length);

  const achadas: CidadeId[] = [];
  let restante = alvo;
  for (const c of porTamanho) {
    const rotulo = normalizar(c.rotulo);
    if (restante.includes(rotulo)) {
      achadas.push(c.id);
      // Consome o trecho para que "Balneário Camboriú" não conte também
      // como "Camboriú".
      restante = restante.split(rotulo).join(" ");
    }
  }
  return achadas;
}

/**
 * As cidades da fala mais recente que menciona alguma — e só dela.
 *
 * Existe por um erro que só aparece em conversa de verdade, nunca em teste de
 * uma mensagem só. A guarda olhava a conversa inteira e barrava quando via
 * mais de uma cidade. Só que a agente sabe as oito cidades atendidas e as
 * lista quando perguntam — e a resposta dela entra no histórico. Bastava
 * alguém perguntar "quais cidades vocês atendem?", pergunta óbvia numa
 * reunião, para toda cotação seguinte daquela conversa ser barrada por
 * "cita mais de uma cidade". A agente ficava muda sobre preço justamente
 * depois de mostrar a cobertura.
 *
 * Uma lista de cobertura não escolhe cidade nenhuma; a fala seguinte escolhe.
 * Então o que vale é a última fala que fala de cidade — e se ELA cita várias
 * ("é em Itajaí... na verdade Navegantes"), aí sim é ambiguidade real e quem
 * chama é a guarda.
 */
function cidadesDaFalaMaisRecente(conversa: string, regras: RegrasNegocio): readonly CidadeId[] {
  const falas = conversa.split("\n");
  for (let i = falas.length - 1; i >= 0; i--) {
    const achadas = cidadesCitadas(falas[i], regras);
    if (achadas.length > 0) return achadas;
  }
  return [];
}

/** Como o cliente de obra chama cada produto. */
const APELIDOS_PRODUTO: Record<ProdutoId, RegExp> = {
  tambor: /tambor/,
  "cacamba-grande": /grande/,
  // "Média" é como o dono chama a menor (06/10/2026). Com \b, para "imediata"
  // não virar pedido de caçamba.
  "cacamba-menor": /menor|pequena|pequeno|\bmedi[ao]\b/,
};

export function produtosCitados(
  texto: string,
  regras: RegrasNegocio = REGRAS_EXPRESS_ENTULHO,
): readonly ProdutoId[] {
  const alvo = normalizar(texto);
  return regras.produtos.filter((p) => APELIDOS_PRODUTO[p.id]?.test(alvo)).map((p) => p.id);
}

export function materiaisCitados(
  texto: string,
  regras: RegrasNegocio = REGRAS_EXPRESS_ENTULHO,
): readonly MaterialId[] {
  const alvo = normalizar(texto);
  return regras.materiais.filter((m) => alvo.includes(normalizar(m.rotulo))).map((m) => m.id);
}

/* ----------------------------------------------------- a guarda de valores */

/**
 * Por que a resposta não pode sair — ou `null` quando pode.
 *
 * O preço vigente é produto × material, igual nas cidades atendidas.
 * Cidade continua obrigatória para conferir cobertura e disponibilidade do
 * produto (tambor apenas em Itajaí). Produto e material vêm da fala mais
 * recente que os identifica; o modelo não pode trocar o contexto para obter
 * um valor permitido de outra combinação.
 */
export function motivoDaGuarda(
  texto: string,
  regras: RegrasNegocio = REGRAS_EXPRESS_ENTULHO,
  conversa = "",
): string | null {
  const citados = valoresCitados(texto);
  if (citados.length === 0) return null;
  if (!podeCotar(regras)) return "não há preço cadastrado e o modelo citou valor";

  // A cidade pode ter sido dita a qualquer momento — pelo cliente antes, ou
  // pela própria resposta ("em Itajaí a menor sai por..."). Quem manda é a
  // resposta: se ela nomeia a cidade, é sobre aquela cidade que ela cota.
  const naResposta = cidadesCitadas(texto, regras);
  if (naResposta.length > 1) {
    return "a resposta cita mais de uma cidade e cotou mesmo assim";
  }

  const naConversa = cidadesDaFalaMaisRecente(conversa, regras);
  if (naResposta.length === 0 && naConversa.length > 1) {
    return "a última fala cita mais de uma cidade e o modelo cotou mesmo assim";
  }

  const cidade = naResposta[0] ?? naConversa[0];
  if (cidade == null) return "o modelo cotou sem a cidade estar definida";

  // Resposta que cota uma cidade enquanto a conversa pedia outra: o valor até
  // pode ser verdadeiro, mas quem lê entende que é o preço da sua obra.
  if (naResposta.length === 1 && naConversa.length === 1 && naResposta[0] !== naConversa[0]) {
    const pedida = regras.cidades.find((c) => c.id === naConversa[0])?.rotulo ?? naConversa[0];
    const cotada = regras.cidades.find((c) => c.id === naResposta[0])?.rotulo ?? naResposta[0];
    return `a conversa é sobre ${pedida} e o modelo cotou ${cotada}`;
  }
  const daCidade = regras.precoPadraoTodasCidades
    ? regras.precos.filter((p) =>
        regras.produtos.find((produto) => produto.id === p.produto)?.cidades.includes(cidade),
      )
    : regras.precos.filter((p) => p.cidade === cidade);
  if (daCidade.length === 0) {
    const rotulo = regras.cidades.find((c) => c.id === cidade)?.rotulo ?? cidade;
    return `não há produto com preço cadastrado disponível para ${rotulo} e o modelo cotou`;
  }

  const ultimos = <T>(extrair: (fala: string) => readonly T[]): readonly T[] => {
    for (const fala of conversa.split("\n").reverse()) {
      const achados = extrair(fala);
      if (achados.length) return achados;
    }
    return [];
  };
  const produtosResposta = produtosCitados(texto, regras);
  const materiaisResposta = materiaisCitados(texto, regras);
  const produtosConversa = ultimos((fala) => produtosCitados(fala, regras));
  const materiaisConversa = ultimos((fala) => materiaisCitados(fala, regras));
  if (produtosConversa.length === 1 && produtosResposta.some((p) => p !== produtosConversa[0])) {
    return "o modelo cotou um produto diferente do pedido";
  }
  if (materiaisConversa.length === 1 && materiaisResposta.some((m) => m !== materiaisConversa[0])) {
    return "o modelo cotou um material diferente do informado";
  }
  const produtos = produtosConversa.length ? produtosConversa : produtosResposta;
  const materiais = materiaisConversa.length ? materiaisConversa : materiaisResposta;
  if (!produtos.length || materiais.length !== 1) {
    return "o modelo cotou sem produto e material únicos confirmados";
  }
  if (produtos.length > 1) return "comparação de preços exige revisão humana";
  const candidatos = daCidade.filter(
    (p) => p.produto === produtos[0] && p.material === materiais[0],
  );

  const permitidos = candidatos.map((p) => p.valorReais);
  if (regras.diariaExtraReais != null) permitidos.push(regras.diariaExtraReais);

  const proibido = citados.find((v) => !permitidos.some((p) => Math.abs(p - v) < 0.005));
  if (proibido == null) return null;

  const rotulo = regras.cidades.find((c) => c.id === cidade)?.rotulo ?? cidade;
  return regras.precoPadraoTodasCidades
    ? `R$ ${proibido} não é preço cadastrado para essa combinação; o preço padrão vale em ${rotulo}`
    : `R$ ${proibido} não é preço cadastrado para essa combinação em ${rotulo}`;
}

/** A resposta pode sair? Ver `motivoDaGuarda` para o porquê de cada recusa. */
export function respostaSegura(
  texto: string,
  regras: RegrasNegocio = REGRAS_EXPRESS_ENTULHO,
  conversa = "",
): boolean {
  return motivoDaGuarda(texto, regras, conversa) === null;
}

/* ------------------------------------------------------- memória da conversa */

export type LinhaDoHistorico = {
  readonly direction: "entrada" | "saida";
  readonly author: "cliente" | "ia" | "humano" | "sistema";
  readonly kind: string;
  readonly body: string | null;
};

/**
 * Turnos seguidos do mesmo lado viram um só. Acontece quando o cliente manda
 * três mensagens antes da resposta, ou quando uma resposta nossa não foi
 * gravada; alguns provedores da cadeia recusam papéis repetidos em sequência.
 */
export function juntarTurnos(turnos: readonly Turno[]): Turno[] {
  const out: Turno[] = [];
  for (const t of turnos) {
    const anterior = out[out.length - 1];
    if (anterior && anterior.role === t.role) {
      out[out.length - 1] = { role: t.role, content: `${anterior.content}\n${t.content}` };
    } else {
      out.push(t);
    }
  }
  return out;
}

/**
 * O histórico gravado no banco, no formato que o modelo lê.
 *
 * Sem isto cada mensagem chegava sozinha: o cliente dizia a cidade numa
 * mensagem e o material na seguinte, e a agente perguntava a cidade de novo.
 * A guarda de preço também dependia disso — ela procura a cidade na conversa,
 * e sem conversa nunca havia cidade.
 *
 * Registros de "sistema" (falha de entrega) ficam de fora: são para a equipe,
 * e a agente não disse aquilo ao cliente.
 */
export function historicoDaConversa(linhas: readonly LinhaDoHistorico[]): Turno[] {
  const turnos: Turno[] = [];
  for (const l of linhas) {
    if (l.author === "sistema") continue;
    const texto = l.body?.trim();
    if (l.direction === "entrada") {
      turnos.push({ role: "user", content: texto || `[o cliente enviou: ${l.kind}]` });
    } else if (texto) {
      turnos.push({ role: "assistant", content: texto });
    }
  }
  const primeiroDoCliente = turnos.findIndex((t) => t.role === "user");
  return primeiroDoCliente === -1 ? [] : juntarTurnos(turnos.slice(primeiroDoCliente));
}

/* ------------------------------------------------------------- hora do dia */

const FUSO_DA_EMPRESA = "America/Sao_Paulo";

/**
 * Cumprimento certo para a hora em Itajaí. Decidido aqui e não pelo modelo:
 * sem saber a hora, ele chutava — "Bom dia" às 3h e "Boa tarde" 15 minutos
 * depois, na mesma conversa.
 */
export function saudacaoPara(agora: Date): string {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: FUSO_DA_EMPRESA,
      hour: "numeric",
      hourCycle: "h23",
    }).format(agora),
  );
  if (hora >= 5 && hora < 12) return "bom dia";
  if (hora >= 12 && hora < 18) return "boa tarde";
  return "boa noite";
}

function momentoAtual(agora: Date): string {
  const quando = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_DA_EMPRESA,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(agora);
  return (
    `AGORA: ${quando}, horário de Brasília. Se for cumprimentar, use "${saudacaoPara(agora)}" ` +
    "e nenhum outro cumprimento de horário. Cumprimente só na primeira resposta da conversa."
  );
}

/* ------------------------------------------------------------ system prompt */

function montarSystemPrompt(regras: RegrasNegocio, agora: Date): string {
  return [
    `Você é o atendente virtual da ${regras.empresa}, locadora de caçambas para entulho.`,
    "Fala português do Brasil, em tom direto e cordial, como quem atende obra.",
    "Responda em no máximo 3 frases curtas. Nada de listas ou markdown — é WhatsApp.",
    "",
    // O jeito abaixo não é invenção de estilo: é como o dono atende de fato,
    // transcrito da conversa dele com cliente em 19/09 (sábado), Itapema,
    // gesso. A tabela vigente é confirmada separadamente nas regras. As frases
    // entre aspas são dele, na grafia dele. Copiar o que já funciona vale
    // mais do que inventar uma persona.
    "COMO O DONO ATENDE, e é assim que você atende:",
    "- Ele abre perguntando as DUAS coisas de uma vez: cidade E BAIRRO, e qual",
    "  o material do descarte, dando exemplos do que cabe — entulho de obra,",
    "  móveis, terra, telhas, madeira, mdf, gesso, vidro, poda.",
    "- Quando o cliente responde 'entulho', 'entulho de obra' ou 'tem bastante",
    "  coisa', o dono NÃO cota na hora: ele pergunta 'tem mdf ou gesso?'. Ele",
    "  não está recusando entulho — está checando se tem material caro MISTURADO",
    "  no meio, porque é isso que muda o preço. Faça a mesma pergunta antes de",
    "  cotar entulho, e só cote depois que o cliente disser que não tem.",
    "- Ao cotar, dê o valor vigente da matriz E os dias incluídos na mesma frase.",
    "- Ele oferece as opções e devolve a escolha ao cliente: 'Qual tamanho de",
    "  caçamba ideal para sua obra?', 'Estou aqui para te ajudar a decidir qual",
    "  caçamba escolher!'.",
    "- Quando não pode fazer algo, ele diz o motivo em vez de só negar: 'Nao",
    "  consigo baixar o preço amigo, pois teve reajuste de preço no aterro mesmo",
    "  ficando menos dias'. Repare que ele já fecha a porta do 'e se eu ficar",
    "  menos dias?'. Dê sempre o porquê.",
    "- Todo prazo vem com o motivo junto: 'Para recolher estamos pedindo 24",
    "  horas no máximo, pois estamos com uma alta demanda!'.",
    "- Ele confirma com 'Perfeito' e fecha com agradecimento caloroso: 'Muito",
    "  obrigado pela confiança', 'Estamos aqui sempre que precisar!'. Pode usar.",
    "- Ele fecha confirmando o próximo passo concreto, não com frase vaga.",
    "",
    "O QUE VOCÊ NÃO PODE COPIAR DELE — e é pouco, mas é importante:",
    "O dono diz 'já abri uma ordem de serviço' e 'já avisei a logística' porque",
    "ele de fato abre e avisa. VOCÊ NÃO. Diga o mesmo passo sem se atribuir a",
    "ação: 'vou passar para a equipe abrir a ordem de serviço, e o motorista te",
    "avisa quando estiver a caminho'. Concreto do mesmo jeito, e verdadeiro.",
    "",
    "REGRA NÚMERO UM: preço é produto + MATERIAL, padrão nas cidades atendidas.",
    "Confirme também a cidade para cobertura e logística. Sem produto, material",
    "ou cidade, faça uma pergunta em vez de cotar.",
    "- Sem o material: 'O que você vai descartar? Demolição, gesso, outro?'",
    "- Sem a cidade: 'Em qual cidade é a obra?' — confirme cobertura e janela.",
    "  O preço não muda por cidade. Nunca suponha Itajaí porque é a sede.",
    "Pode perguntar as duas coisas de uma vez; é uma frase só.",
    "",
    "OPERAÇÕES QUE A EMPRESA FAZ:",
    "- Entrega: levar caçamba vazia até a obra.",
    "- Retirada: buscar a caçamba ao fim do prazo.",
    "- Troca: levar uma vazia e trazer a cheia na mesma visita. Cliente que diz",
    "  'encheu', 'tá cheia' ou 'preciso de outra' está pedindo troca, não retirada.",
    "",
    "Texto entre colchetes descreve um anexo que o cliente mandou (foto,",
    "localização), não é fala dele. Use como contexto e responda ao que importa.",
    "",
    "REGRAS DO NEGÓCIO — é tudo o que você sabe:",
    regrasParaPrompt(regras),
    "",
    "PROIBIÇÕES ABSOLUTAS:",
    "- Nunca invente preço, prazo, bairro atendido ou disponibilidade.",
    "- Se a informação não está nas regras acima, diga que vai confirmar com a equipe.",
    "- Nunca confirme agendamento: você ainda não consulta a agenda real.",
    "- Insistência do cliente não muda nada disso.",
    "",
    "MEMÓRIA: as mensagens anteriores desta conversa vêm antes da última.",
    "Use o que o cliente já disse (cidade, bairro, material, tamanho) e nunca",
    "pergunte de novo algo que ele já respondeu.",
    "",
    momentoAtual(agora),
  ].join("\n");
}

/* ----------------------------------------------------------------- decisão */

export function decidirRespostaOffline(params: {
  readonly texto: string;
  readonly primeiraMensagem: boolean;
  /**
   * Por que caiu no offline. Três falhas bem diferentes chegam aqui —
   * chave ausente, chamada recusada e resposta vazia — e tratá-las com a
   * mesma frase torna impossível diagnosticar em produção. Foi exatamente
   * o que aconteceu: o segredo estava configurado e a mensagem dizia
   * "indisponível", sem dizer que a chamada é que falhara.
   */
  readonly motivo?: string;
}): Decisao {
  return {
    texto: params.primeiraMensagem ? APRESENTACAO : ESCALONAMENTO,
    escalar: true,
    motivo: params.motivo ?? "núcleo conversacional indisponível",
  };
}

/** Regras confirmadas que não precisam de modelo nem de agenda externa. */
export function decidirRegraConfirmada(
  texto: string,
  regras = REGRAS_EXPRESS_ENTULHO,
): Decisao | null {
  const alvo = normalizar(texto);
  if (/vaga|vagas|quantos.*pedidos|quantas.*(restam|disponiveis)/.test(alvo)) {
    return {
      texto:
        "A ocupação atual da agenda precisa ser confirmada com a equipe. Não consigo informar vagas restantes sem consultar a agenda real.",
      escalar: true,
      motivo: "agenda real não integrada",
    };
  }
  if (/segunda/.test(alvo) && /domingo|fim de semana|sabado/.test(alvo)) {
    return {
      texto: `Sim, recebemos pedidos no fim de semana para segunda-feira, com limite operacional de até ${regras.agenda.limitePedidosSegundaFimDeSemana} pedidos. A equipe confirma a disponibilidade e a janela de entrega antes de fechar o agendamento.`,
      escalar: true,
      motivo: "confirmar agenda com a equipe",
    };
  }
  if (
    regras.precoPadraoTodasCidades &&
    /cobram mais|mais caro|preco.*(cidade|mesmo)|valor.*(cidade|mesmo)/.test(alvo)
  ) {
    return {
      texto:
        "O preço do mesmo produto e material é igual em todas as cidades atendidas. A distância da central em Itajaí altera somente a logística: conforme a rota, pode exigir até 1 hora ou 1 dia adicional, sem acréscimo de preço.",
      escalar: false,
    };
  }
  if (/distante|distancia|longe/.test(alvo) && /entrega|prazo|cidade/.test(alvo)) {
    return {
      texto:
        "Conforme a distância da central em Itajaí e a rota, a entrega pode exigir até 1 hora ou 1 dia adicional. O preço não muda; informe a cidade e o endereço para a equipe confirmar a janela.",
      escalar: true,
      motivo: "janela logística requer confirmação",
    };
  }
  const produtos = produtosCitados(texto, regras);
  const materiais = materiaisCitados(texto, regras);
  const cidades = cidadesCitadas(texto, regras);
  const cotacao =
    /quanto|custa|preco|valor|orcamento/.test(alvo) ||
    (produtos.length && materiais.length && cidades.length);
  if (!cotacao) return null;
  if (!materiais.length)
    return {
      texto:
        "Qual material você vai descartar: demolição, gesso ou outro? Informe também o tamanho da caçamba e a cidade da obra.",
      escalar: false,
    };
  if (!produtos.length)
    return {
      texto: "Você precisa de caçamba menor, grande ou tambor? Em qual cidade fica a obra?",
      escalar: false,
    };
  if (!cidades.length)
    return {
      texto:
        "Em qual cidade fica a obra? Preciso conferir se o produto é atendido e a janela logística.",
      escalar: false,
    };
  if (produtos.length !== 1 || materiais.length !== 1 || cidades.length !== 1)
    return {
      texto: ESCALONAMENTO,
      escalar: true,
      motivo: "cotação com produto, material ou cidade ambíguos",
    };
  const valor = buscarPreco(regras, produtos[0], materiais[0], cidades[0]);
  if (valor == null)
    return {
      texto: ESCALONAMENTO,
      escalar: true,
      motivo: "combinação sem preço confirmado ou produto não atendido",
    };
  // Entulho genérico pode conter gesso/MDF; o dono confirma a mistura primeiro.
  if (materiais[0] === "entulho")
    return {
      texto:
        "Esse entulho tem gesso ou MDF misturado? Preciso confirmar o material antes de cotar.",
      escalar: false,
    };
  const produto = produtoPorId(regras, produtos[0]);
  return {
    texto: `${produto?.rotulo} para ${materiais[0] === "demolicao" ? "demolição" : materiais[0]}: R$ ${valor}, com ${produto?.diasIncluidos} dias na obra. O preço é padrão entre cidades atendidas; a equipe confirma a disponibilidade e a janela de entrega.`,
    escalar: true,
    motivo: "confirmar disponibilidade e janela com a equipe",
  };
}

export async function decidirResposta(params: {
  readonly texto: string;
  readonly historico?: readonly Turno[];
  readonly primeiraMensagem: boolean;
  readonly regras?: RegrasNegocio;
  /** Anexo que o agente não interpreta — áudio, vídeo, comprovante. */
  readonly forcarHumano?: boolean;
  readonly agora?: Date;
}): Promise<Decisao> {
  const regras = params.regras ?? REGRAS_EXPRESS_ENTULHO;

  // Áudio e comprovante: o agente não transcreve nem confere pagamento.
  if (params.forcarHumano) {
    return {
      texto: RECEBIDO_VAI_PARA_HUMANO,
      escalar: true,
      motivo: "anexo que o agente não interpreta",
    };
  }

  // Alçada comercial não passa pelo modelo: é decisão de gente.
  if (precisaDeHumano(params.texto)) {
    return { texto: ESCALONAMENTO, escalar: true, motivo: "assunto fora da alçada do agente" };
  }

  // Histórico continua passando pelo modelo para não confundir assunto anterior
  // com um pedido novo. Mensagens completas recebem a regra confirmada direto.
  if (
    !params.historico?.length ||
    /vaga|segunda|distante|distancia|longe|cobram mais|mais caro/.test(normalizar(params.texto))
  ) {
    const confirmada = decidirRegraConfirmada(params.texto, regras);
    if (confirmada) return confirmada;
  }

  const system = montarSystemPrompt(regras, params.agora ?? new Date());
  const mensagens = juntarTurnos([
    ...(params.historico ?? []),
    { role: "user", content: params.texto },
  ]);

  const disponiveis = CADEIA_DE_PROVEDORES.filter((p) => p.configurado());
  if (disponiveis.length === 0) {
    return decidirRespostaOffline({
      ...params,
      motivo: "nenhum provedor configurado — falta ANTHROPIC_API_KEY ou GROQ_API_KEY",
    });
  }

  /**
   * Uma tentativa: o texto, ou o motivo de não ter dado.
   *
   * Resposta VAZIA conta como falha, não como resposta. Nos modelos com
   * raciocínio ela acontece quando o raciocínio consome o orçamento inteiro
   * de tokens — e antes isso encerrava a conversa direto, com o cliente
   * levando um "vou confirmar com a equipe" porque o modelo pensou demais.
   * Isso não é motivo para incomodar uma pessoa: o próximo provedor tenta.
   */
  async function tentar(p: Provedor): Promise<{ texto?: string; erro?: string }> {
    try {
      const texto = await p.responder(system, mensagens);
      if (!texto) return { erro: `${p.nome} devolveu resposta vazia` };
      return { texto };
    } catch (error) {
      console.error(`Falha em ${p.nome}:`, error);
      return { erro: p.resumirErro(error) };
    }
  }

  let bruto: string | undefined;
  const falhas: string[] = [];

  for (const provedor of disponiveis) {
    const r = await tentar(provedor);
    if (r.texto) {
      if (falhas.length > 0) {
        console.warn(`Respondido por ${provedor.nome} depois de: ${falhas.join("; ")}`);
      }
      bruto = r.texto;
      break;
    }
    falhas.push(r.erro ?? `${provedor.nome} falhou`);
  }

  if (bruto == null) {
    // Toda a cadeia caiu. O motivo lista cada provedor, porque um painel que
    // mostra só a última falha manda consertar a coisa errada — foi assim que
    // um 429 da reserva já apareceu com o nome do principal.
    return decidirRespostaOffline({ ...params, motivo: falhas.join("; ") });
  }

  // A conferência que o prompt sozinho não garante. Recebe a conversa inteira
  // porque a cidade costuma ter sido dita várias mensagens antes do preço.
  const conversa = [...(params.historico ?? []).map((t) => t.content), params.texto].join("\n");
  const barrado = motivoDaGuarda(bruto, regras, conversa);
  if (barrado) {
    console.warn(`Resposta do modelo barrada pela guarda de preço: ${barrado}`);
    return { texto: ESCALONAMENTO, escalar: true, motivo: `guarda de preço: ${barrado}` };
  }

  // Quando o próprio modelo diz que vai confirmar com a equipe, isso É um
  // escalonamento — a conversa não pode ficar parada esperando ninguém.
  if (prometeuConfirmar(bruto)) {
    return { texto: bruto, escalar: true, motivo: "o agente não soube e encaminhou" };
  }

  return { texto: bruto, escalar: !podeCotar(regras) };
}

/**
 * O modelo prometeu retorno humano? Então marque a conversa para um humano.
 * Sem isso, a promessa de "já te confirmo" morre e o cliente fica esperando.
 */
const PROMESSAS = [
  /confirmar com (a|o) (equipe|pessoal|respons)/i,
  /vou (confirmar|verificar|checar)/i,
  /consultar a equipe/i,
  /te retorn/i,
  /uma pessoa (da equipe|daqui)/i,
];

export function prometeuConfirmar(texto: string): boolean {
  return PROMESSAS.some((r) => r.test(texto));
}

/**
 * Motivo curto e legível no painel, sem vazar corpo de erro inteiro.
 *
 * Cuidado com um atalho de raciocínio que já custou tempo: "deve ser a cota
 * que o pipeline de matérias gastou". Na Groq o teto diário é POR MODELO, e
 * os dois caminhos usam modelos diferentes — a agente pede `MODELO_AGENTE`,
 * o pipeline pede `openai/gpt-oss-20b`. Por isso cada status ganha uma frase
 * própria: quem lê o painel precisa saber qual das causas é, não qual parece.
 */
export function resumirErro(error: unknown, modelo: string = MODELO_AGENTE): string {
  const status = (error as { status?: number } | null)?.status;
  if (status === 429)
    return `cota da Groq esgotada (429) no modelo ${modelo} — na Groq o teto é por modelo`;
  if (status === 401 || status === 403) return `a Groq recusou a chave (${status})`;
  if (status === 404) return "modelo não encontrado na Groq (404)";
  if (typeof status === "number") return `a Groq respondeu ${status}`;
  const msg = error instanceof Error ? error.message : String(error);
  return `falha ao chamar a Groq: ${msg.slice(0, 120)}`;
}
