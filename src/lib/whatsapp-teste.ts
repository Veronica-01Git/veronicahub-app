/**
 * Sala de teste da agente — `POST /api/whatsapp/testar`.
 *
 * POR QUE ISTO EXISTE. Até 22/09 o único jeito de conversar com a agente era
 * o simulador de terminal (`npm run agente`), numa máquina de desenvolvimento.
 * Isso significa que o dono da Express Entulho **não conseguia testar sozinho**
 * — precisava de alguém sentado do lado dele rodando comandos. E o passo 2 do
 * ROTEIRO-DE-SUBIDA.md promete justamente que ele testa e aprova antes de
 * qualquer mensagem sair. A promessa existia sem o meio de cumpri-la.
 *
 * O QUE ESTE ENDPOINT NÃO FAZ, e é a parte que importa:
 *
 * Ele chama `decidirResposta`, que é exatamente o mesmo caminho do WhatsApp
 * real — mesmo prompt, mesmas regras, MESMA GUARDA DE PREÇO. O que ele não
 * faz é enviar: não importa `sendText`, não conhece número de telefone, não
 * toca na Graph da Meta. A trava `WHATSAPP_ENVIO_LIBERADO` segue valendo para
 * o WhatsApp e é irrelevante aqui, porque aqui não há para onde enviar.
 *
 * Testar a agente e a agente falar com cliente são coisas separadas por
 * construção, não por configuração.
 *
 * POR QUE PEDE UM TOKEN. A página que consome isto vive dentro de
 * /clientes/express-entulho/operacoes, que é pública e indexável desde 21/09.
 * Endpoint público que chama modelo de linguagem é conta de terceiro aberta:
 * qualquer um que ache a URL gasta a cota da Anthropic e da Groq. Então o
 * acesso é por um segredo no link — o dono recebe um endereço com `?t=...` e
 * usa sem login. Sem `TESTE_AGENTE_TOKEN` configurado, o endpoint fica
 * desligado em vez de aberto.
 */

import { decidirResposta, motivoDaGuarda, type Turno } from "./whatsapp-agent";
import { REGRAS_EXPRESS_ENTULHO } from "./whatsapp-rules";

/** Teto de mensagens por chamada. Histórico gigante é custo e é abuso. */
const MAX_TURNOS = 40;
const MAX_CARACTERES = 1200;

export type RespostaTeste = {
  readonly texto: string;
  readonly escalar: boolean;
  readonly motivo?: string;
  /**
   * O que a guarda diria da resposta, para a tela poder mostrar. É calculado
   * de novo aqui, e não reaproveitado de dentro da decisão, porque quando a
   * guarda barra o cliente recebe a frase de escalonamento — e o dono precisa
   * ver que houve uma barrada, não só o "vou confirmar".
   */
  readonly guarda: string | null;
};

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function autorizado(request: Request): boolean {
  const esperado = process.env.TESTE_AGENTE_TOKEN;
  if (!esperado) return false; // sem segredo configurado, endpoint desligado
  const url = new URL(request.url);
  const recebido = url.searchParams.get("t") ?? request.headers.get("x-teste-token");
  return recebido === esperado;
}

export async function handleTesteAgente(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ erro: "method not allowed" }, 405);

  if (!autorizado(request)) {
    return json(
      {
        erro: process.env.TESTE_AGENTE_TOKEN
          ? "link de teste inválido"
          : "sala de teste desligada — falta TESTE_AGENTE_TOKEN no servidor",
      },
      401,
    );
  }

  let corpo: { texto?: unknown; historico?: unknown };
  try {
    corpo = (await request.json()) as typeof corpo;
  } catch {
    return json({ erro: "corpo inválido" }, 400);
  }

  const texto = typeof corpo.texto === "string" ? corpo.texto.trim() : "";
  if (!texto) return json({ erro: "mande um texto" }, 400);
  if (texto.length > MAX_CARACTERES) return json({ erro: "mensagem longa demais" }, 400);

  // O histórico vem do navegador, então é dado de fora: filtra formato e
  // corta tamanho em vez de confiar.
  const historico: Turno[] = Array.isArray(corpo.historico)
    ? corpo.historico
        .filter(
          (t): t is Turno =>
            typeof t === "object" &&
            t !== null &&
            (t as Turno).role !== undefined &&
            ((t as Turno).role === "user" || (t as Turno).role === "assistant") &&
            typeof (t as Turno).content === "string",
        )
        .slice(-MAX_TURNOS)
        .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_CARACTERES) }))
    : [];

  const decisao = await decidirResposta({
    texto,
    historico,
    primeiraMensagem: historico.length === 0,
    regras: REGRAS_EXPRESS_ENTULHO,
  });

  const conversa = [...historico.map((t) => t.content), texto, decisao.texto].join("\n");
  const guarda = motivoDaGuarda(decisao.texto, REGRAS_EXPRESS_ENTULHO, conversa);

  const resposta: RespostaTeste = {
    texto: decisao.texto,
    escalar: decisao.escalar,
    motivo: decisao.motivo,
    guarda,
  };
  return json(resposta);
}
