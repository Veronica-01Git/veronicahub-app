/**
 * PONTE: `Provedor` (src/lib/whatsapp-provedores.ts) → `ProviderAdapter`.
 *
 * Os quatro provedores da agente de WhatsApp já existem, já foram corrigidos
 * em produção (incidentes de 19/09) e continuam sendo a fonte da verdade de
 * como falar com Anthropic, Groq e Gemini. Este adaptador os coloca atrás do
 * ModelRouter sem reescrever nenhum e sem mudar a cadeia atual da agente.
 *
 * O import é só de TIPO: este arquivo não carrega SDK nenhum. Quem chama
 * passa o `Provedor` pronto (ex.: `CADEIA_DE_PROVEDORES[0]`).
 *
 * LIMITES DECLARADOS:
 *   - `estimateCostMicros` devolve null. Não há tabela de preço por token no
 *     repositório, e chutar um número aqui faria o teto de custo mentir. Com
 *     teto definido, a política "allow" do router tenta e registra custo
 *     desconhecido; "block" pula.
 *   - `costMicros` do resultado também é null, pelo mesmo motivo: o
 *     `Provedor` devolve só o texto, não o uso de tokens.
 *   - `responder` não aceita AbortSignal. O router corta pelo tempo mesmo
 *     assim (a corrida devolve o controle), mas a chamada HTTP de baixo pode
 *     terminar sozinha depois.
 */

import type { Mensagem, Provedor } from "../../whatsapp-provedores.ts";
import type { AdapterRequest, AdapterResult, ProviderAdapter } from "../model-router.ts";

export type LlmInput = {
  readonly system: string;
  readonly messages: readonly Mensagem[];
};

export function fromProvedor(
  provedor: Provedor,
  providerId: string,
): ProviderAdapter<LlmInput, string> {
  return {
    provider: providerId,
    model: provedor.modelo,
    type: "LLM",
    isConfigured: () => provedor.configurado(),
    estimateCostMicros: () => null,
    async invoke(request: AdapterRequest<LlmInput>): Promise<AdapterResult<string>> {
      const texto = await provedor.responder(request.input.system, request.input.messages);
      // Resposta vazia é falha para quem chama — a cadeia original já trata
      // assim (passa para o próximo provedor em vez de mandar silêncio).
      if (!texto) throw new Error("resposta vazia do modelo");
      return { output: texto, costMicros: null };
    },
    describeError: (error) => provedor.resumirErro(error),
  };
}
