/**
 * Quem responde, e a quê — as regras de atendimento do número dedicado.
 *
 * Funções puras: sem banco, sem rede, sem relógio implícito. O webhook
 * (whatsapp-webhook.ts) lê o banco, chama estas funções e obedece. Separar
 * assim é o que permite testar as três regras abaixo sem Meta e sem Postgres.
 *
 * 1. CONVERSA COM HUMANO É DO HUMANO. Depois que a agente passa a conversa
 *    para uma pessoa, ela não volta a falar sozinha — nem quando o cliente
 *    manda mensagem nova. Duas vozes na mesma conversa é pior que uma
 *    resposta lenta: a agente pode desfazer o que a pessoa combinou. Só a
 *    equipe devolve a conversa para a agente (ou a encerra).
 *
 * 2. MENSAGENS EM RAJADA VIRAM UMA RESPOSTA. Cliente de obra escreve "oi",
 *    "quanto custa", "pra itajaí" em cinco segundos. Cada uma chega num
 *    webhook separado, em paralelo. Sem agrupar, saem três respostas, cada
 *    uma enxergando só parte do pedido. A regra: espera-se um pouco, e só o
 *    webhook da mensagem MAIS RECENTE responde — pelo lote inteiro.
 *
 * 3. O LOTE É REIVINDICADO ANTES DE RESPONDER. Quem vai responder grava um
 *    marcador com chave única (`lote:<wamid>`). É o que impede duas
 *    respostas para o mesmo lote se dois webhooks chegarem à mesma conclusão,
 *    e é a fronteira do próximo lote: o que chegar depois do marcador é
 *    pedido novo.
 *
 * Nada aqui envia mensagem. Nada aqui conhece o número atual da Express
 * Entulho, que não é migrado, lido nem tocado (AGENTS.md).
 */

import { extrairConteudo, type MensagemMeta } from "./whatsapp-mensagem";
import { marcarComoTranscricao } from "./whatsapp-voz";

/* --------------------------------------------------------- 1. de quem é */

export type StatusConversa = "ia" | "aguardando_humano" | "resolvida";

/**
 * A agente pode responder nesta conversa?
 *
 * `resolvida` volta para a agente: cliente que escreve depois de um pedido
 * encerrado está começando outro assunto, e atendê-lo na hora é o ponto.
 */
export function agentePodeResponder(status: StatusConversa): boolean {
  return status !== "aguardando_humano";
}

/* ------------------------------------------------------ 2. agrupamento */

/**
 * Quanto esperar por mais mensagens antes de responder.
 *
 * Curto o bastante para o cliente não achar que ninguém viu (o "lido" sai na
 * hora), longo o bastante para pegar a rajada típica de quem digita aos
 * pedaços. Fica bem abaixo dos 30 s que o Workers concede ao waitUntil.
 */
export const JANELA_AGRUPAMENTO_MS = 4000;

/** Prefixo do marcador de lote — ver regra 3 no topo. */
export const PREFIXO_LOTE = "lote:";

export function chaveDoLote(providerIdMaisRecente: string): string {
  return `${PREFIXO_LOTE}${providerIdMaisRecente}`;
}

export type LinhaDaConversa = {
  readonly id: string;
  readonly providerId: string;
  readonly direction: "entrada" | "saida";
  readonly author: "cliente" | "ia" | "humano" | "sistema";
  readonly kind: string;
  readonly body: string | null;
  /** Payload cru da Meta (só nas entradas). */
  readonly raw: string | null;
};

export type Lote =
  | { readonly responder: false; readonly motivo: string }
  | {
      readonly responder: true;
      /** Texto do lote inteiro, uma mensagem por linha, como o modelo lê. */
      readonly texto: string;
      /** Algo no lote só uma pessoa resolve (áudio não transcrito, anexo). */
      readonly forcarHumano: boolean;
      /** Ids das linhas do lote — ficam de fora do histórico. */
      readonly ids: readonly string[];
    };

function conteudoDaLinha(linha: LinhaDaConversa): {
  texto: string;
  forcarHumano: boolean;
  ignorar: boolean;
} {
  let mensagem: MensagemMeta | null = null;
  try {
    mensagem = linha.raw ? (JSON.parse(linha.raw) as MensagemMeta) : null;
  } catch {
    mensagem = null;
  }

  // Sem payload legível sobra o corpo gravado; sem corpo, o tipo do anexo.
  if (!mensagem) {
    const corpo = linha.body?.trim() ?? "";
    return {
      texto: corpo || `[o cliente enviou: ${linha.kind}]`,
      forcarHumano: !corpo,
      ignorar: false,
    };
  }

  const conteudo = extrairConteudo(mensagem);
  if (conteudo.precisaTranscrever) {
    // O webhook grava a transcrição no corpo da própria linha. Corpo presente
    // é áudio entendido; ausente é áudio que uma pessoa precisa ouvir.
    const transcricao = linha.body?.trim();
    return transcricao
      ? { texto: marcarComoTranscricao(transcricao), forcarHumano: false, ignorar: false }
      : { texto: conteudo.paraOAgente, forcarHumano: true, ignorar: false };
  }
  return {
    texto: conteudo.paraOAgente,
    forcarHumano: conteudo.humanoObrigatorio,
    ignorar: conteudo.ignorar,
  };
}

/**
 * O lote que a mensagem `idAtual` deve responder — ou por que não deve.
 *
 * `linhas` vem em ordem cronológica. O lote são as entradas do cliente
 * depois da última linha que fecha lote (ver `fechaLote`).
 * Só responde quem é a entrada mais recente: se chegou outra depois, é o
 * webhook dela que fala pelo grupo.
 */
/**
 * O que fecha um lote: resposta da agente, resposta de pessoa ou marcador de
 * lote. Aviso de "sistema" como falha de entrega NÃO fecha — não é resposta,
 * e tratá-lo como tal deixaria o pedido do cliente sem ninguém responder.
 */
function fechaLote(l: LinhaDaConversa): boolean {
  if (l.direction !== "saida") return false;
  return l.author !== "sistema" || l.kind === "lote";
}

export function montarLote(linhas: readonly LinhaDaConversa[], idAtual: string): Lote {
  let inicio = 0;
  for (let i = linhas.length - 1; i >= 0; i--) {
    if (fechaLote(linhas[i])) {
      inicio = i + 1;
      break;
    }
  }
  const entradas = linhas.slice(inicio).filter((l) => l.direction === "entrada");

  if (!entradas.some((l) => l.id === idAtual)) {
    return { responder: false, motivo: "mensagem já respondida em outro lote" };
  }
  if (entradas[entradas.length - 1].id !== idAtual) {
    return { responder: false, motivo: "chegou mensagem mais nova; ela responde pelo grupo" };
  }

  const partes: string[] = [];
  let forcarHumano = false;
  for (const linha of entradas) {
    const c = conteudoDaLinha(linha);
    if (c.ignorar) continue;
    partes.push(c.texto);
    forcarHumano ||= c.forcarHumano;
  }
  if (!partes.length) return { responder: false, motivo: "lote só com figurinha ou reação" };

  return {
    responder: true,
    texto: partes.join("\n"),
    forcarHumano,
    ids: entradas.map((l) => l.id),
  };
}

/* ------------------------------------------------------ 3. aviso à equipe */

/** Últimos 4 dígitos: dá para a equipe achar o cliente sem expor o número. */
export function finalDoNumero(waId: string): string {
  const digitos = waId.replace(/\D/g, "");
  return digitos.length >= 4 ? `final ${digitos.slice(-4)}` : "número oculto";
}

/**
 * O e-mail que avisa a equipe que um cliente espera por uma pessoa.
 *
 * O texto da conversa NÃO vai no e-mail: e-mail se encaminha, fica em
 * caixa de entrada de celular, vaza. Vai o mínimo para agir — quem, por quê
 * e onde responder. O conteúdo está no painel, atrás de login.
 */
export function mensagemDeAlerta(params: {
  readonly nome: string | null;
  readonly waId: string;
  readonly motivo: string | undefined;
  readonly urlPainel: string;
}): { assunto: string; texto: string } {
  const quem = params.nome?.trim() ? params.nome.trim().slice(0, 60) : "Cliente";
  const final = finalDoNumero(params.waId);
  return {
    assunto: `Express Entulho · ${quem} (${final}) aguarda atendimento humano`,
    texto: [
      `${quem} (${final}) está esperando uma pessoa da equipe no WhatsApp da agente.`,
      "",
      `Motivo: ${params.motivo?.slice(0, 160) || "a agente encaminhou para a equipe"}.`,
      "A agente não responde mais nesta conversa até alguém devolvê-la.",
      "",
      `Responder pelo painel: ${params.urlPainel}`,
      "",
      "Este aviso vem do número dedicado da agente. O WhatsApp atual da empresa não é lido nem alterado.",
    ].join("\n"),
  };
}

/* ------------------------------------------- 4. Coexistence: eco do app */

/**
 * Mensagem que a EQUIPE mandou pelo aplicativo WhatsApp Business do celular.
 *
 * Com o Coexistence, o mesmo número fica no app e na Cloud API. Quando alguém
 * responde um cliente pelo celular, a Meta avisa o webhook no campo
 * `smb_message_echoes`. Sem tratar esse aviso, a agente não saberia que uma
 * pessoa já respondeu e falaria por cima dela — exatamente a regra 1 deste
 * arquivo, só que vinda do celular em vez do painel.
 */
export type EcoDoApp = {
  /** O CLIENTE (destinatário do eco), no formato que a Meta devolve. */
  readonly waId: string;
  readonly providerId: string;
  readonly kind: string;
  readonly texto: string;
  readonly ocorridoEm: Date;
};

type EcoMeta = MensagemMeta & { to?: string };

export function extrairEcos(
  value: { message_echoes?: readonly EcoMeta[] } | undefined,
  agora: Date = new Date(),
): readonly EcoDoApp[] {
  const out: EcoDoApp[] = [];
  for (const eco of value?.message_echoes ?? []) {
    if (!eco?.id || !eco.to) continue;
    const conteudo = extrairConteudo(eco);
    const segundos = Number(eco.timestamp);
    out.push({
      waId: eco.to,
      providerId: eco.id,
      kind: conteudo.kind,
      texto: conteudo.texto || conteudo.paraOAgente,
      ocorridoEm: Number.isFinite(segundos) && segundos > 0 ? new Date(segundos * 1000) : agora,
    });
  }
  return out;
}

/**
 * Campos do webhook que existem só no Coexistence e que NÃO são mensagem
 * nova: `history` (cópia de até 6 meses de conversas do app) e
 * `smb_app_state_sync` (contatos do app).
 *
 * São ignorados de propósito. Guardar o histórico inteiro aqui seria juntar
 * dado pessoal sem necessidade — ele continua no celular da empresa — e
 * tratá-lo como mensagem faria a agente responder conversa de meses atrás.
 */
export const CAMPOS_IGNORADOS_COEXISTENCE: ReadonlySet<string> = new Set([
  "history",
  "smb_app_state_sync",
]);
