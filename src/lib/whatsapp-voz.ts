/**
 * A voz da agente — texto vira nota de voz no WhatsApp.
 *
 * POR QUE ISSO IMPORTA NESTE NEGÓCIO. Cliente de caçamba conversa por áudio.
 * Ele manda áudio dirigindo, no meio da obra, com a mão suja. Receber texto
 * de volta é receber resposta na língua errada. Nenhum concorrente de
 * atendimento automatizado desta região responde falando.
 *
 * A REGRA QUE GOVERNA TUDO AQUI: **preço nunca vai só em áudio.**
 *
 * Áudio não se relê. Quem ouviu "duzentos e vinte" e entendeu "duzentos e
 * doze" não tem como conferir sem ouvir de novo, e quem fecha negócio por
 * áudio mal ouvido reclama depois — com razão. Então a decisão é: resposta
 * que cita valor vai em TEXTO, e só em texto. Áudio fica para o resto da
 * conversa, que é onde ele ganha: pergunta, confirmação, "já te retorno".
 *
 * Isso não é excesso de zelo. É a mesma regra da guarda de preço em
 * whatsapp-agent.ts, aplicada ao canal em vez de ao conteúdo: o número tem
 * que poder ser conferido por quem recebeu.
 *
 * SEM TRANSCODIFICAÇÃO. Nota de voz no WhatsApp exige OGG/Opus mono — os
 * outros formatos aceitos (mp3, aac, m4a) chegam como anexo de arquivo, com
 * cara de documento, não de áudio. E não há ffmpeg dentro de um Worker. Por
 * isso a ElevenLabs é chamada JÁ pedindo opus_48000_*: o que sai de lá entra
 * na Meta sem passar por conversão nenhuma.
 */

import { valoresCitados } from "./whatsapp-agent";

/**
 * Liga a voz. Desligado por padrão: enquanto não houver ELEVENLABS_API_KEY e
 * uma voz escolhida, a agente responde em texto exatamente como hoje, e
 * nada neste arquivo chega a ser chamado.
 */
export function vozConfigurada(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);
}

/**
 * Limite de caracteres por nota de voz.
 *
 * Dois motivos, e o segundo é o que manda: a ElevenLabs cobra por caractere,
 * e nota de voz longa não é ouvida. Três frases é o tamanho que o prompt da
 * agente já pede; isto aqui é a rede que pega o dia em que o modelo não
 * obedecer.
 */
const MAX_CARACTERES_VOZ = 600;

export type MotivoSemVoz = "desligada" | "cita_valor" | "longa_demais" | "escalou" | "vazia";

export type DecisaoDeVoz =
  | { readonly falar: true }
  | { readonly falar: false; readonly motivo: MotivoSemVoz };

/**
 * Esta resposta pode ir em áudio?
 *
 * Função pura e sem rede, de propósito — é ela que carrega a regra de
 * negócio, então é ela que precisa ser testável sem chave de API nenhuma.
 */
export function decidirVoz(texto: string, opcoes: { escalar: boolean }): DecisaoDeVoz {
  if (!vozConfigurada()) return { falar: false, motivo: "desligada" };

  const limpo = texto.trim();
  if (!limpo) return { falar: false, motivo: "vazia" };

  // Valor citado vai em texto, para poder ser relido e conferido.
  if (valoresCitados(limpo).length > 0) return { falar: false, motivo: "cita_valor" };

  // Conversa escalada é conversa que uma PESSOA vai assumir. O histórico que
  // ela vai ler precisa estar em texto, não em áudio que ela teria que ouvir.
  if (opcoes.escalar) return { falar: false, motivo: "escalou" };

  if (limpo.length > MAX_CARACTERES_VOZ) return { falar: false, motivo: "longa_demais" };

  return { falar: true };
}

export type VozResultado =
  | { readonly ok: true; readonly audio: Uint8Array; readonly mimeType: string }
  | { readonly ok: false; readonly erro: string };

/**
 * Formato pedido à ElevenLabs. `opus_48000_64` é OGG/Opus a 64 kbps — voz
 * falada não melhora acima disso, e cada kbps a mais é byte trafegado no
 * celular de quem recebe, muitas vezes em rede de obra.
 */
const FORMATO_SAIDA = "opus_48000_64";

/** Mime exigido pela Meta para que o áudio vire NOTA DE VOZ, não anexo. */
export const MIME_NOTA_DE_VOZ = "audio/ogg";

/**
 * Modelo de voz. Trocável por ambiente pela mesma razão que o modelo de
 * texto é: nome de modelo é a peça que mais quebra sem aviso.
 */
const MODELO_VOZ = process.env.ELEVENLABS_MODELO ?? "eleven_multilingual_v2";

/** Texto vira bytes de OGG/Opus. Nunca lança: erro volta como valor. */
export async function sintetizar(texto: string): Promise<VozResultado> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) return { ok: false, erro: "voz não configurada" };

  try {
    const resposta = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${FORMATO_SAIDA}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          text: texto,
          model_id: MODELO_VOZ,
        }),
      },
    );

    if (!resposta.ok) {
      // Corpo de erro nunca é ecoado inteiro: pode trazer eco de credencial.
      return { ok: false, erro: `ElevenLabs respondeu ${resposta.status}` };
    }

    const bytes = new Uint8Array(await resposta.arrayBuffer());
    if (bytes.byteLength === 0) return { ok: false, erro: "ElevenLabs devolveu áudio vazio" };

    return { ok: true, audio: bytes, mimeType: MIME_NOTA_DE_VOZ };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, erro: `falha ao falar com a ElevenLabs: ${msg.slice(0, 120)}` };
  }
}
