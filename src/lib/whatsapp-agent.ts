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

import Groq from "groq-sdk";
import {
  podeCotar,
  regrasParaPrompt,
  REGRAS_EXPRESS_ENTULHO,
  type CidadeId,
  type MaterialId,
  type ProdutoId,
  type RegrasNegocio,
} from "./whatsapp-rules";

/**
 * Modelo da agente. Exportado porque o diagnóstico precisa sondar EXATAMENTE
 * este, e não outro: na Groq a cota diária é por modelo.
 *
 * ESCOLHIDO POR PROVA, NÃO POR MEMÓRIA. Em 19/09 a agente estava muda: os
 * dois modelos configurados devolviam 404, primário e reserva, e toda
 * conversa caía no caminho offline. Nome de modelo na Groq muda, e chutar
 * outro de cabeça é repetir o erro.
 *
 * Estes dois são os que o pipeline de matérias usa em articles-server.ts, e
 * que geraram matérias em 19/09 com esta mesma GROQ_API_KEY — ou seja, são
 * identificadores válidos comprovados em produção, não lembrança.
 *
 * O 120B vem primeiro por dois motivos: é o mais capaz dos dois, e é o que o
 * pipeline editorial quase não toca (lá ele é reserva, acionado só quando o
 * 20B estoura). Sobra cota para a agente.
 */
export const MODELO_AGENTE = "openai/gpt-oss-120b";

/**
 * Modelo de reserva, tentado quando o primeiro não atende.
 *
 * Na Groq **a cota é por modelo**, e articles-server.ts registra que "os
 * modelos GPT-OSS têm cotas gratuitas separadas" — então o 20B ainda responde
 * quando a cota do 120B acabou, e vice-versa.
 *
 * Reserva não é permissão para inventar: a resposta dela passa pela mesma
 * guarda de preço. O que muda é conversar em vez de encaminhar.
 *
 * ATENÇÃO ao trocar qualquer um dos dois: um nome errado deixa a agente muda
 * sem aviso, e o sintoma (ela encaminha tudo) parece problema de regra e não
 * de configuração. O endpoint /api/whatsapp/diagnostico diz qual é a causa.
 */
export const MODELO_RESERVA = "openai/gpt-oss-20b";
const MAX_TOKENS = 320;

/**
 * Vale tentar a reserva? Só quando o problema é do modelo, não da conta.
 * Chave recusada (401/403) seria recusada igual no segundo modelo — insistir
 * só gastaria tempo do cliente esperando.
 */
function vaiParaReserva(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  if (status === 429 || status === 404) return true;
  return typeof status === "number" && status >= 500;
}

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
function cidadesDaFalaMaisRecente(
  conversa: string,
  regras: RegrasNegocio,
): readonly CidadeId[] {
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
  "cacamba-menor": /menor|pequena|pequeno/,
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
 * ESTA FUNÇÃO É O "O CÓDIGO DECIDE" DO ARQUIVO. Até 17/09 ela conferia só o
 * número, e isso deixava passar o erro mais caro que existe neste negócio:
 *
 *   Cliente: "caçamba menor, demolição, em Itapema"
 *   Modelo:  "Sai por R$ 220."
 *
 * R$ 220 está na lista de valores permitidos, então a conferência antiga
 * aprovava. Só que 220 é o preço de ITAJAÍ. Para Itapema não existe preço
 * cadastrado — a empresa nunca nos disse. A agente cotaria um valor que a
 * Express não pratica, e quem descobre isso é o cliente, depois, na fatura.
 *
 * Preço aqui é produto × material × cidade. A conferência agora é da
 * combinação inteira:
 *
 * 1. Valor sem cidade na conversa não sai. Não dá para supor Itajaí só
 *    porque é a sede — a maioria das cidades atendidas não é Itajaí. A cidade
 *    que vale é a da própria resposta e, na falta dela, a da fala mais recente
 *    que mencionou alguma. Ver `cidadesDaFalaMaisRecente`.
 * 2. Com a cidade definida, só passam preços DAQUELA cidade.
 * 3. Quando a resposta identifica um único produto e um único material, a
 *    conferência vira exata: é o preço daquela combinação ou não é nada.
 *
 * O custo de errar para mais é uma escalação — alguns minutos de uma pessoa.
 * O custo de errar para menos é uma cotação falsa em nome da empresa.
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
  const daCidade = regras.precos.filter((p) => p.cidade === cidade);
  if (daCidade.length === 0) {
    const rotulo = regras.cidades.find((c) => c.id === cidade)?.rotulo ?? cidade;
    return `não há preço cadastrado para ${rotulo} e o modelo cotou`;
  }

  // Estreita só quando não há ambiguidade: uma resposta que compara a menor
  // com a grande cita dois produtos, e aí a conferência fica no nível da
  // cidade em vez de recusar uma resposta legítima.
  const produtos = produtosCitados(texto, regras);
  const materiais = materiaisCitados(texto, regras);
  const candidatos = daCidade.filter(
    (p) =>
      (produtos.length === 1 ? p.produto === produtos[0] : true) &&
      (materiais.length === 1 ? p.material === materiais[0] : true),
  );

  const permitidos = candidatos.map((p) => p.valorReais);
  if (regras.diariaExtraReais != null) permitidos.push(regras.diariaExtraReais);

  const proibido = citados.find((v) => !permitidos.some((p) => Math.abs(p - v) < 0.005));
  if (proibido == null) return null;

  const rotulo = regras.cidades.find((c) => c.id === cidade)?.rotulo ?? cidade;
  return `R$ ${proibido} não é preço cadastrado para essa combinação em ${rotulo}`;
}

/** A resposta pode sair? Ver `motivoDaGuarda` para o porquê de cada recusa. */
export function respostaSegura(
  texto: string,
  regras: RegrasNegocio = REGRAS_EXPRESS_ENTULHO,
  conversa = "",
): boolean {
  return motivoDaGuarda(texto, regras, conversa) === null;
}

/* ------------------------------------------------------------ system prompt */

function montarSystemPrompt(regras: RegrasNegocio): string {
  return [
    `Você é o atendente virtual da ${regras.empresa}, locadora de caçambas para entulho.`,
    "Fala português do Brasil, em tom direto e cordial, como quem atende obra.",
    "Responda em no máximo 3 frases curtas. Nada de listas ou markdown — é WhatsApp.",
    "",
    // O jeito abaixo não é invenção de estilo: é como o dono atende de fato,
    // observado numa conversa real dele com cliente. Copiar o que já funciona
    // vale mais do que inventar uma persona.
    "COMO O DONO ATENDE, e é assim que você atende:",
    "- Ele abre perguntando as DUAS coisas de uma vez: cidade (e bairro) e qual",
    "  o material do descarte, dando exemplos do que cabe — entulho de obra,",
    "  móveis, terra, telhas, madeira, mdf, gesso, vidro, poda.",
    "- Ao cotar, ele dá o valor E o prazo na mesma frase: 'caçamba menor, 250",
    "  reais e fica 3 dias na sua obra'.",
    "- Ele oferece as opções e devolve a escolha ao cliente: 'qual tamanho é o",
    "  ideal para sua obra?', 'estou aqui para te ajudar a decidir'.",
    "- Quando não pode fazer algo, ele diz o motivo em vez de só negar: recusou",
    "  desconto explicando que houve reajuste no aterro. Dê sempre o porquê.",
    "- Ele fecha confirmando o próximo passo concreto, não com frase vaga.",
    "",
    "REGRA NÚMERO UM: preço aqui é produto + MATERIAL + CIDADE. Faltando",
    "qualquer um dos três, você faz uma pergunta em vez de dar um valor.",
    "- Sem o material: 'O que você vai descartar? Demolição, gesso, outro?'",
    "- Sem a cidade: 'Em qual cidade é a obra?' — o preço muda de cidade para",
    "  cidade, e a maioria das cidades atendidas não é Itajaí. Nunca suponha",
    "  Itajaí porque é a sede.",
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

export async function decidirResposta(params: {
  readonly texto: string;
  readonly historico?: readonly Turno[];
  readonly primeiraMensagem: boolean;
  readonly regras?: RegrasNegocio;
  /** Anexo que o agente não interpreta — áudio, vídeo, comprovante. */
  readonly forcarHumano?: boolean;
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return decidirRespostaOffline({ ...params, motivo: "GROQ_API_KEY não configurada" });
  }

  const mensagens = [
    { role: "system" as const, content: montarSystemPrompt(regras) },
    ...(params.historico ?? []).map((t) => ({ role: t.role, content: t.content })),
    { role: "user" as const, content: params.texto },
  ];

  async function pedir(modelo: string): Promise<string> {
    const groq = new Groq({ apiKey });
    const resposta = await groq.chat.completions.create({
      model: modelo,
      max_completion_tokens: MAX_TOKENS,
      messages: mensagens,
    });
    return (resposta.choices[0]?.message?.content ?? "").trim();
  }

  let bruto: string;
  try {
    bruto = await pedir(MODELO_AGENTE);
  } catch (error) {
    console.error(`Falha ao chamar a Groq em ${MODELO_AGENTE}:`, error);
    if (!vaiParaReserva(error)) {
      return decidirRespostaOffline({ ...params, motivo: resumirErro(error) });
    }
    // Cota, modelo sumido ou instabilidade da Groq: a reserva tem cota
    // própria e pode salvar a conversa em vez de encaminhá-la.
    try {
      bruto = await pedir(MODELO_RESERVA);
      console.warn(
        `Groq respondeu pela reserva ${MODELO_RESERVA} — primário: ${resumirErro(error)}`,
      );
    } catch (erroReserva) {
      console.error(`Falha também na reserva ${MODELO_RESERVA}:`, erroReserva);
      return decidirRespostaOffline({
        ...params,
        motivo: `${resumirErro(error)}; reserva também falhou (${resumirErro(erroReserva)})`,
      });
    }
  }

  if (!bruto) {
    return decidirRespostaOffline({ ...params, motivo: "o modelo devolveu resposta vazia" });
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
export function resumirErro(error: unknown): string {
  const status = (error as { status?: number } | null)?.status;
  if (status === 429)
    return `cota da Groq esgotada (429) no modelo ${MODELO_AGENTE} — na Groq o teto é por modelo`;
  if (status === 401 || status === 403) return `a Groq recusou a chave (${status})`;
  if (status === 404) return "modelo não encontrado na Groq (404)";
  if (typeof status === "number") return `a Groq respondeu ${status}`;
  const msg = error instanceof Error ? error.message : String(error);
  return `falha ao chamar a Groq: ${msg.slice(0, 120)}`;
}
