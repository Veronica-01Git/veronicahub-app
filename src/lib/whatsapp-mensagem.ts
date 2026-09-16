/**
 * Normaliza a mensagem que a Meta entrega.
 *
 * O atendimento da Express Entulho é feito de áudio, foto e localização, não
 * só de texto — o cliente manda o pin da obra, a foto do entulho e o
 * comprovante de pagamento. Antes disso aqui, tudo que não fosse `text`
 * chegava ao agente como string vazia e ele respondia a nada.
 *
 * Regra que organiza o arquivo: o que o agente NÃO consegue interpretar de
 * verdade vai para um humano. Áudio ele não transcreve; comprovante ele não
 * confere. Fingir que entendeu é pior do que encaminhar.
 */

export type MensagemMeta = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: { caption?: string; mime_type?: string };
  video?: { caption?: string };
  document?: { caption?: string; filename?: string };
  audio?: { voice?: boolean };
  sticker?: Record<string, unknown>;
  location?: { latitude?: number; longitude?: number; name?: string; address?: string };
  contacts?: { name?: { formatted_name?: string } }[];
  button?: { text?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
};

export type ConteudoRecebido = {
  /** Como classificar no banco. */
  readonly kind: string;
  /** O que o cliente escreveu, se escreveu. Vazio para áudio e figurinha. */
  readonly texto: string;
  /** O que o modelo enxerga — inclui a descrição do anexo entre colchetes. */
  readonly paraOAgente: string;
  /** O agente não consegue tratar isso; escala sem nem chamar o modelo. */
  readonly humanoObrigatorio: boolean;
  /** Figurinha e reação: não respondemos. */
  readonly ignorar: boolean;
};

function coordenada(n: number | undefined): string {
  return typeof n === "number" ? n.toFixed(6) : "?";
}

export function extrairConteudo(m: MensagemMeta): ConteudoRecebido {
  const tipo = m.type ?? "text";

  switch (tipo) {
    case "text": {
      const corpo = m.text?.body ?? "";
      return {
        kind: "text",
        texto: corpo,
        paraOAgente: corpo,
        humanoObrigatorio: false,
        ignorar: corpo.trim() === "",
      };
    }

    case "image": {
      const legenda = m.image?.caption ?? "";
      return {
        kind: "image",
        texto: legenda,
        paraOAgente: legenda
          ? `[o cliente enviou uma foto] ${legenda}`
          : "[o cliente enviou uma foto, sem legenda]",
        humanoObrigatorio: false,
        ignorar: false,
      };
    }

    case "location": {
      const l = m.location ?? {};
      const rotulo = l.name ?? l.address ?? `${coordenada(l.latitude)}, ${coordenada(l.longitude)}`;
      return {
        kind: "location",
        texto: rotulo,
        paraOAgente: `[o cliente enviou a localização da obra: ${rotulo}]`,
        humanoObrigatorio: false,
        ignorar: false,
      };
    }

    // Áudio é o canal preferido deste público. O agente não transcreve, então
    // não finge: manda para um humano ouvir.
    case "audio":
    case "voice":
      return {
        kind: "audio",
        texto: "",
        paraOAgente: "[o cliente enviou um áudio]",
        humanoObrigatorio: true,
        ignorar: false,
      };

    case "video":
      return {
        kind: "video",
        texto: m.video?.caption ?? "",
        paraOAgente: "[o cliente enviou um vídeo]",
        humanoObrigatorio: true,
        ignorar: false,
      };

    // Quase sempre comprovante de pagamento ou nota. Confirmar pagamento não
    // é decisão de agente.
    case "document": {
      const nome = m.document?.filename ?? "arquivo";
      return {
        kind: "document",
        texto: m.document?.caption ?? "",
        paraOAgente: `[o cliente enviou um documento: ${nome}]`,
        humanoObrigatorio: true,
        ignorar: false,
      };
    }

    case "sticker":
      return {
        kind: "sticker",
        texto: "",
        paraOAgente: "",
        humanoObrigatorio: false,
        ignorar: true,
      };

    case "reaction":
      return {
        kind: "reaction",
        texto: "",
        paraOAgente: "",
        humanoObrigatorio: false,
        ignorar: true,
      };

    case "contacts": {
      const nome = m.contacts?.[0]?.name?.formatted_name ?? "um contato";
      return {
        kind: "contacts",
        texto: nome,
        paraOAgente: `[o cliente compartilhou o contato de ${nome}]`,
        humanoObrigatorio: true,
        ignorar: false,
      };
    }

    case "button": {
      const t = m.button?.text ?? "";
      return {
        kind: "button",
        texto: t,
        paraOAgente: t,
        humanoObrigatorio: false,
        ignorar: t === "",
      };
    }

    case "interactive": {
      const t = m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "";
      return {
        kind: "interactive",
        texto: t,
        paraOAgente: t,
        humanoObrigatorio: false,
        ignorar: t === "",
      };
    }

    default:
      return {
        kind: tipo,
        texto: "",
        paraOAgente: `[o cliente enviou algo que eu não consigo ler: ${tipo}]`,
        humanoObrigatorio: true,
        ignorar: false,
      };
  }
}
