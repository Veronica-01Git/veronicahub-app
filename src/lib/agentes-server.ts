/**
 * Servidor dos Agentes de IA (/agentes).
 *
 * O QUE ESTE ARQUIVO DECIDE, E O QUE ELE NÃO DECIDE.
 *
 * Preço nunca vem do cliente — vem de src/lib/agentes.ts, lido aqui dentro.
 * É a mesma regra de wallet-server.ts, e pelo mesmo motivo: um preço que
 * viaja pelo navegador é um preço que o navegador pode trocar.
 *
 * A PARTE NOVA, E O PORQUÊ DELA. O caminho padrão do mercado para pôr uma
 * empresa dentro de um agente é um formulário de trinta campos que ninguém
 * preenche. Aqui o dono fala (áudio), ou cola a conversa que já tem no
 * celular, e o modelo extrai a matriz. Depois — e isso é o que vende — a
 * Veronica vira CLIENTE e conversa com a agente recém-alimentada, na frente
 * dele, antes de ele pagar.
 *
 * A GUARDA VALE NA SIMULAÇÃO TAMBÉM. A agente de demonstração sofre a mesma
 * conferência da agente de produção: valor que não está no briefing não sai
 * da boca dela, vira encaminhamento. Uma demonstração que alucina preço é
 * pior que nenhuma demonstração — ela ensina o cliente a confiar no que não
 * dá para confiar. A conferência reaproveita `valoresCitados` de
 * whatsapp-agent.ts em vez de reimplementar o mesmo regex.
 */

import { createServerFn } from "@tanstack/react-start";
import Groq from "groq-sdk";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { users, ledgerEntries, agenteAssinaturas, agenteBriefings } from "./schema";
import { getSessionUserId } from "./session";
import { checkGenerationRateLimit } from "./rate-limit";
import { valoresCitados } from "./whatsapp-agent";
import { CADEIA_DE_PROVEDORES, type Mensagem } from "./whatsapp-provedores";
import { AGENTES, agente, plano, type AgenteId, type PlanoId } from "./agentes";

/* ------------------------------------------------------------- limites */

/** Áudio cru. ~8 MB cobre uns 15 minutos de voz em opus/m4a com folga. */
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
/** Trecho de conversa colado. Um export de WhatsApp de um dia cabe aqui. */
const MAX_BRIEFING_CHARS = 60_000;
const MAX_TURNOS_SIMULACAO = 12;

/**
 * Modelo de transcrição. O nome vem dos tipos do próprio groq-sdk instalado
 * (resources/audio/transcriptions.d.ts), não de memória — a lição dos dois
 * 404 de 19/09 documentados em whatsapp-provedores.ts. Trocável por env
 * para que mudar de modelo não exija deploy.
 */
const MODELO_TRANSCRICAO = process.env.GROQ_MODELO_TRANSCRICAO ?? "whisper-large-v3-turbo";

const AGENTE_IDS = new Set<string>(AGENTES.map((a) => a.id));

function lerAgenteId(valor: unknown): AgenteId {
  if (typeof valor !== "string" || !AGENTE_IDS.has(valor)) {
    throw new Error("Agente inválido.");
  }
  return valor as AgenteId;
}

/* ---------------------------------------------------------- cadeia LLM */

/**
 * Uma resposta de texto, tentando os provedores em ordem. Mesma cadeia do
 * agente de produção (Anthropic principal, Groq de reserva) — assim a
 * demonstração falha do mesmo jeito que o produto falha, e o que o cliente
 * vê na simulação é o que ele vai ter depois.
 */
async function responderComCadeia(
  system: string,
  mensagens: readonly Mensagem[],
): Promise<{ ok: true; texto: string } | { ok: false; erro: string }> {
  const disponiveis = CADEIA_DE_PROVEDORES.filter((p) => p.configurado());
  if (disponiveis.length === 0) {
    return { ok: false, erro: "Nenhum provedor de IA configurado no servidor." };
  }

  const motivos: string[] = [];
  for (const provedor of disponiveis) {
    try {
      const texto = await provedor.responder(system, mensagens);
      // Resposta vazia conta como falha, não como resposta: nos modelos com
      // raciocínio ela significa que o orçamento foi todo para o raciocínio.
      if (texto) return { ok: true, texto };
      motivos.push(`${provedor.nome}: resposta vazia`);
    } catch (error) {
      motivos.push(provedor.resumirErro(error));
    }
  }
  return { ok: false, erro: motivos.join(" · ") };
}

/* ------------------------------------------------------- assinaturas */

export type EstadoAgente = {
  agenteId: AgenteId;
  status: "sem_acesso" | "teste" | "ativa" | "expirada" | "cancelada";
  plano: "teste" | "avulso" | "mensal" | "anual" | null;
  expiraEm: string | null;
  /** true quando dá para usar agora, seja por teste ou por plano pago. */
  liberado: boolean;
  /** Já gastou o teste grátis alguma vez? Impede um segundo. */
  testeJaUsado: boolean;
};

/**
 * Estado de cada agente para o usuário da sessão.
 *
 * Expiração é decidida aqui, comparando com o relógio do servidor. A linha
 * no banco não é reescrita na leitura — um GET que escreve viraria corrida
 * entre abas; quem promove `teste` para `expirada` é a própria tentativa de
 * uso, mais abaixo.
 */
export const meusAgentes = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const db = getDb();
  const linhas = await db
    .select()
    .from(agenteAssinaturas)
    .where(eq(agenteAssinaturas.userId, userId));

  const agora = Date.now();
  const estados: EstadoAgente[] = AGENTES.map((a) => {
    const linha = linhas.find((l) => l.agenteId === a.id);
    if (!linha) {
      return {
        agenteId: a.id,
        status: "sem_acesso",
        plano: null,
        expiraEm: null,
        liberado: false,
        testeJaUsado: false,
      };
    }
    const vencido = linha.expiraEm ? linha.expiraEm.getTime() <= agora : false;
    const ativo = (linha.status === "teste" || linha.status === "ativa") && !vencido;
    return {
      agenteId: a.id,
      status: vencido && linha.status !== "cancelada" ? "expirada" : linha.status,
      plano: linha.plano,
      expiraEm: linha.expiraEm ? linha.expiraEm.toISOString() : null,
      liberado: ativo,
      testeJaUsado: true,
    };
  });

  return estados;
});

/**
 * Começa o teste grátis. O relógio arranca AQUI, no primeiro uso — não no
 * cadastro. Quem abre a página e fecha não queima as 6 horas.
 *
 * Idempotente por construção: o índice único (userId, agenteId) faz a
 * segunda chamada cair no `onConflictDoNothing`, então duplo-clique, duas
 * abas ou refresh devolvem o mesmo teste em vez de um novo.
 */
export const iniciarTeste = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({
    agenteId: lerAgenteId((input as { agenteId?: unknown })?.agenteId),
  }))
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) return { ok: false as const, error: "Faça login para começar o teste." };

    const config = agente(data.agenteId);
    if (config.testeHoras <= 0) {
      return { ok: false as const, error: "Este agente não tem teste grátis." };
    }

    const db = getDb();
    const expiraEm = new Date(Date.now() + config.testeHoras * 60 * 60 * 1000);

    await db
      .insert(agenteAssinaturas)
      .values({
        userId,
        agenteId: data.agenteId,
        status: "teste",
        plano: "teste",
        expiraEm,
      })
      .onConflictDoNothing({
        target: [agenteAssinaturas.userId, agenteAssinaturas.agenteId],
      });

    const [linha] = await db
      .select()
      .from(agenteAssinaturas)
      .where(
        and(eq(agenteAssinaturas.userId, userId), eq(agenteAssinaturas.agenteId, data.agenteId)),
      )
      .limit(1);

    if (!linha) return { ok: false as const, error: "Não consegui abrir o teste. Tente de novo." };

    const vencido = linha.expiraEm ? linha.expiraEm.getTime() <= Date.now() : false;
    if (vencido && linha.status === "teste") {
      return {
        ok: false as const,
        error: "Seu teste grátis já foi usado. Escolha um plano para continuar.",
      };
    }

    return { ok: true as const, expiraEm: linha.expiraEm?.toISOString() ?? null };
  });

/**
 * Garante que o usuário pode usar o agente agora. Aqui sim a linha vencida é
 * promovida para `expirada` — quem tenta usar é quem paga o custo da escrita,
 * e não há corrida porque o UPDATE é condicional ao status atual.
 */
async function exigirAcesso(
  userId: string,
  agenteId: AgenteId,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const [linha] = await db
    .select()
    .from(agenteAssinaturas)
    .where(and(eq(agenteAssinaturas.userId, userId), eq(agenteAssinaturas.agenteId, agenteId)))
    .limit(1);

  if (!linha) return { ok: false, error: "Comece o teste grátis para usar este agente." };
  if (linha.status === "cancelada") return { ok: false, error: "Assinatura cancelada." };

  const vencido = linha.expiraEm ? linha.expiraEm.getTime() <= Date.now() : false;
  if (vencido) {
    await db
      .update(agenteAssinaturas)
      .set({ status: "expirada", atualizadoEm: new Date() })
      .where(and(eq(agenteAssinaturas.id, linha.id), eq(agenteAssinaturas.status, linha.status)));
    return {
      ok: false,
      error:
        linha.plano === "teste"
          ? "Seu teste de 6 horas terminou. Escolha um plano para continuar."
          : "Seu plano venceu. Renove para continuar.",
    };
  }

  if (linha.status === "expirada") {
    return { ok: false, error: "Acesso expirado. Escolha um plano para continuar." };
  }

  return { ok: true };
}

/* ---------------------------------------------------------- briefing */

/**
 * O que o modelo tem permissão de extrair do material do dono.
 *
 * Deliberadamente pequeno. O objetivo não é montar um ERP — é ter o
 * suficiente para a agente cotar sem inventar: o que ela vende, por quanto,
 * onde, e o que ela NUNCA deve responder sozinha.
 */
export type BriefingExtraido = {
  negocio: string;
  /** Frases do próprio dono que definem o tom. Copiadas, não parafraseadas. */
  jeitoDeFalar: string[];
  precos: { item: string; valorReais: number; observacao?: string }[];
  cidades: string[];
  /** Assuntos que sempre vão para uma pessoa (desconto, reclamação, jurídico). */
  escalar: string[];
  /** O que o modelo NÃO achou no material. É isto que o dono precisa completar. */
  lacunas: string[];
};

const PROMPT_EXTRACAO = `Você lê material cru de uma empresa (transcrição de áudio do dono, conversa de WhatsApp colada, ou anotação solta) e devolve um resumo estruturado para alimentar uma agente de atendimento.

REGRAS ABSOLUTAS:
1. Só registre o que está NO MATERIAL. Nunca complete com o que é "comum no ramo".
2. Preço sem valor explícito não vira preço — vira lacuna.
3. Cidade citada de passagem não vira cidade atendida a menos que o material diga que atende lá.
4. Em "jeitoDeFalar", copie frases reais do dono, entre aspas. Não parafraseie.
5. Em "lacunas", liste o que falta para atender bem: preço sem valor, produto sem preço, condição citada sem detalhe.

Responda SOMENTE com JSON válido, sem cercas de código, neste formato:
{"negocio":"","jeitoDeFalar":[],"precos":[{"item":"","valorReais":0,"observacao":""}],"cidades":[],"escalar":[],"lacunas":[]}`;

function extrairJson(texto: string): BriefingExtraido | null {
  // O modelo às vezes embrulha em ```json apesar da instrução.
  const limpo = texto
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (inicio < 0 || fim <= inicio) return null;
  try {
    const bruto = JSON.parse(limpo.slice(inicio, fim + 1)) as Partial<BriefingExtraido>;
    return {
      negocio: typeof bruto.negocio === "string" ? bruto.negocio : "",
      jeitoDeFalar: Array.isArray(bruto.jeitoDeFalar) ? bruto.jeitoDeFalar.map(String) : [],
      precos: Array.isArray(bruto.precos)
        ? bruto.precos
            .filter((p): p is { item: string; valorReais: number; observacao?: string } => {
              const item = (p as { item?: unknown })?.item;
              const valor = (p as { valorReais?: unknown })?.valorReais;
              return typeof item === "string" && typeof valor === "number" && valor > 0;
            })
            .map((p) => ({
              item: p.item,
              valorReais: p.valorReais,
              ...(p.observacao ? { observacao: String(p.observacao) } : {}),
            }))
        : [],
      cidades: Array.isArray(bruto.cidades) ? bruto.cidades.map(String) : [],
      escalar: Array.isArray(bruto.escalar) ? bruto.escalar.map(String) : [],
      lacunas: Array.isArray(bruto.lacunas) ? bruto.lacunas.map(String) : [],
    };
  } catch {
    return null;
  }
}

/**
 * Recebe o material cru e devolve a matriz extraída.
 *
 * O CRU FICA GUARDADO junto com o extraído (AgenteBriefing.conteudo e
 * .extraido). Guardar só o extraído seria perder a fonte, que é o erro que
 * whatsapp-rules.ts documenta ter cometido com dezesseis preços em 18/09.
 * Enquanto `conferido` for false, este material é palpite de modelo — serve
 * para a simulação, não para cliente real.
 */
export const enviarBriefing = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { agenteId?: unknown; fonte?: unknown; conteudo?: unknown };
    // Lista positiva: `unknown` não estreita por desigualdade, então o tipo
    // sai da busca na lista, não de uma sequência de `!==`.
    const FONTES = ["audio", "conversa", "texto"] as const;
    const fonte = FONTES.find((f) => f === data?.fonte);
    if (!fonte) {
      throw new Error("Fonte inválida.");
    }
    const conteudo = data?.conteudo;
    if (typeof conteudo !== "string" || conteudo.trim().length < 20) {
      throw new Error("Material muito curto — escreva, cole ou grave um pouco mais.");
    }
    if (conteudo.length > MAX_BRIEFING_CHARS) {
      throw new Error(
        `Material muito longo (máx. ${MAX_BRIEFING_CHARS.toLocaleString("pt-BR")} caracteres).`,
      );
    }
    return { agenteId: lerAgenteId(data?.agenteId), fonte, conteudo: conteudo.trim() };
  })
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) return { ok: false as const, error: "Faça login para alimentar sua agente." };

    const acesso = await exigirAcesso(userId, data.agenteId);
    if (!acesso.ok) return { ok: false as const, error: acesso.error };

    const limite = await checkGenerationRateLimit(userId);
    if (!limite.ok) return { ok: false as const, error: limite.error };

    const resposta = await responderComCadeia(PROMPT_EXTRACAO, [
      { role: "user", content: data.conteudo },
    ]);
    if (!resposta.ok) return { ok: false as const, error: resposta.erro };

    const extraido = extrairJson(resposta.texto);
    if (!extraido) {
      return {
        ok: false as const,
        error: "Não consegui estruturar esse material. Tente mandar em partes menores.",
      };
    }

    const db = getDb();
    const [linha] = await db
      .insert(agenteBriefings)
      .values({
        userId,
        agenteId: data.agenteId,
        fonte: data.fonte,
        conteudo: data.conteudo,
        extraido: JSON.stringify(extraido),
      })
      .returning();

    return { ok: true as const, briefingId: linha.id, extraido };
  });

/**
 * Transcreve o áudio do dono. É o caminho que dispensa formulário: ele fala
 * como falaria com um funcionário novo, e o texto vira o material.
 *
 * O áudio NÃO é guardado — só a transcrição. Voz é dado sensível e não há
 * motivo de produto para reter o arquivo depois de virar texto.
 */
export const transcreverBriefing = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { agenteId?: unknown; audioBase64?: unknown; mimeType?: unknown };
    const audioBase64 = data?.audioBase64;
    if (typeof audioBase64 !== "string" || audioBase64.length < 100) {
      throw new Error("Áudio vazio.");
    }
    // base64 cresce ~4/3 sobre o binário — confere o tamanho antes de decodificar.
    if ((audioBase64.length * 3) / 4 > MAX_AUDIO_BYTES) {
      throw new Error("Áudio muito longo. Grave em partes de até uns 10 minutos.");
    }
    const mimeType = typeof data?.mimeType === "string" ? data.mimeType : "audio/webm";
    return { agenteId: lerAgenteId(data?.agenteId), audioBase64, mimeType };
  })
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) return { ok: false as const, error: "Faça login para gravar." };

    const acesso = await exigirAcesso(userId, data.agenteId);
    if (!acesso.ok) return { ok: false as const, error: acesso.error };

    const limite = await checkGenerationRateLimit(userId);
    if (!limite.ok) return { ok: false as const, error: limite.error };

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "Transcrição indisponível agora — escreva ou cole a conversa.",
      };
    }

    try {
      const binario = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
      const extensao =
        data.mimeType.includes("mp4") || data.mimeType.includes("m4a") ? "m4a" : "webm";
      const arquivo = new File([binario], `briefing.${extensao}`, { type: data.mimeType });

      const groq = new Groq({ apiKey });
      const transcricao = await groq.audio.transcriptions.create({
        file: arquivo,
        model: MODELO_TRANSCRICAO,
        language: "pt",
        response_format: "json",
      });

      const texto = (transcricao.text ?? "").trim();
      if (!texto) {
        return { ok: false as const, error: "Não consegui ouvir nada. Grave de novo, mais perto." };
      }
      return { ok: true as const, texto };
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;
      if (status === 429) {
        return { ok: false as const, error: "Fila de transcrição cheia. Tente em um minuto." };
      }
      return {
        ok: false as const,
        error: "Falha ao transcrever. Você pode escrever ou colar a conversa no lugar.",
      };
    }
  });

/** Último briefing estruturado do usuário para um agente. */
async function ultimoBriefing(
  userId: string,
  agenteId: AgenteId,
): Promise<BriefingExtraido | null> {
  const db = getDb();
  const [linha] = await db
    .select()
    .from(agenteBriefings)
    .where(and(eq(agenteBriefings.userId, userId), eq(agenteBriefings.agenteId, agenteId)))
    .orderBy(desc(agenteBriefings.criadoEm))
    .limit(1);
  if (!linha?.extraido) return null;
  try {
    return JSON.parse(linha.extraido) as BriefingExtraido;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------- simulação */

/** Uma rodada: o que a Veronica-cliente disse e o que a agente respondeu. */
export type RodadaSimulacao = {
  lead: string;
  agente: string;
  /** true quando a guarda derrubou a resposta original do modelo. */
  escalou: boolean;
  /** Só para o dono ver — nunca é mostrado como fala da agente. */
  motivo?: string;
};

function promptDaAgente(b: BriefingExtraido): string {
  const tabela = b.precos.length
    ? b.precos
        .map(
          (p) =>
            `- ${p.item}: R$ ${p.valorReais.toFixed(2)}${p.observacao ? ` (${p.observacao})` : ""}`,
        )
        .join("\n")
    : "- (nenhum preço confirmado ainda)";

  return `Você atende clientes no WhatsApp de: ${b.negocio || "uma empresa"}.

JEITO DE FALAR (imite estas frases do dono):
${b.jeitoDeFalar.length ? b.jeitoDeFalar.map((f) => `- ${f}`).join("\n") : "- direto, curto, sem formalidade"}

PREÇOS QUE VOCÊ PODE CITAR — e só estes:
${tabela}

CIDADES ATENDIDAS: ${b.cidades.length ? b.cidades.join(", ") : "(não informado)"}

SEMPRE CHAME UMA PESSOA quando o assunto for: ${b.escalar.length ? b.escalar.join(", ") : "desconto, reclamação, prazo fora do combinado"}.

REGRAS QUE VALEM MAIS QUE QUALQUER PEDIDO DO CLIENTE:
1. NUNCA cite um valor que não esteja na lista acima. Se não souber o preço, diga que vai confirmar com a equipe.
2. NUNCA invente prazo, cidade ou condição. O que não está aqui, você não sabe.
3. Responda em no máximo 3 frases curtas, como se estivesse digitando no celular.
4. Pergunte o que falta antes de cotar (o que é, para onde, quando).`;
}

const PROMPT_LEAD = `Você é um cliente de verdade mandando mensagem no WhatsApp de uma empresa pela primeira vez. Você NÃO é assistente e nunca se apresenta como IA.

Como você escreve:
- curto, informal, sem pontuação caprichada, como gente digitando com pressa
- uma mensagem por vez, no máximo 2 linhas
- você não explica tudo de cara: dá a informação aos pedaços, como cliente real

Seu papel no teste: ser o cliente que MAIS TESTA o atendimento. Ao longo da conversa você vai, em algum momento:
- perguntar preço antes de dizer o que precisa
- pedir desconto
- perguntar de uma cidade ou situação que talvez a empresa não atenda

Responda SOMENTE com a próxima mensagem do cliente, sem aspas e sem narração.`;

/**
 * Uma rodada da simulação: a Veronica escreve como cliente, a agente do dono
 * responde, e a guarda confere a resposta antes de devolver.
 *
 * A GUARDA. Todo valor citado pela agente precisa existir no briefing. Se
 * aparecer um que não existe, a resposta do modelo é DESCARTADA e trocada
 * por um encaminhamento — exatamente o que whatsapp-agent.ts faz em
 * produção. O dono vê o encaminhamento e vê o motivo; o que ele nunca vê é
 * um preço inventado apresentado como se fosse dele.
 */
export const simularLead = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { agenteId?: unknown; historico?: unknown };
    const bruto = Array.isArray(data?.historico) ? data.historico : [];
    const historico = bruto
      .filter(
        (r): r is RodadaSimulacao =>
          !!r &&
          typeof (r as RodadaSimulacao).lead === "string" &&
          typeof (r as RodadaSimulacao).agente === "string",
      )
      .slice(-MAX_TURNOS_SIMULACAO)
      .map((r) => ({ lead: r.lead, agente: r.agente, escalou: Boolean(r.escalou) }));
    return { agenteId: lerAgenteId(data?.agenteId), historico };
  })
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) return { ok: false as const, error: "Faça login para simular." };

    const acesso = await exigirAcesso(userId, data.agenteId);
    if (!acesso.ok) return { ok: false as const, error: acesso.error };

    const limite = await checkGenerationRateLimit(userId);
    if (!limite.ok) return { ok: false as const, error: limite.error };

    const briefing = await ultimoBriefing(userId, data.agenteId);
    if (!briefing) {
      return {
        ok: false as const,
        error: "Alimente sua agente primeiro — grave um áudio ou cole uma conversa.",
      };
    }

    // 1. A Veronica escreve a próxima mensagem do cliente. O histórico entra
    //    invertido: para ela, quem "fala" é o cliente (assistant) e quem
    //    "responde" é a empresa (user).
    const contextoLead: Mensagem[] = data.historico.flatMap((r) => [
      { role: "assistant" as const, content: r.lead },
      { role: "user" as const, content: r.agente },
    ]);
    const abertura: Mensagem[] =
      contextoLead.length === 0
        ? [
            {
              role: "user",
              content: `A empresa é: ${briefing.negocio || "um prestador de serviço"}. Mande a primeira mensagem.`,
            },
          ]
        : contextoLead;

    const falaDoLead = await responderComCadeia(PROMPT_LEAD, abertura);
    if (!falaDoLead.ok) return { ok: false as const, error: falaDoLead.erro };

    // 2. A agente do dono responde ao cliente.
    const contextoAgente: Mensagem[] = data.historico.flatMap((r) => [
      { role: "user" as const, content: r.lead },
      { role: "assistant" as const, content: r.agente },
    ]);
    const respostaAgente = await responderComCadeia(promptDaAgente(briefing), [
      ...contextoAgente,
      { role: "user", content: falaDoLead.texto },
    ]);
    if (!respostaAgente.ok) return { ok: false as const, error: respostaAgente.erro };

    // 3. A guarda. Mesmo regex do agente de produção (whatsapp-agent.ts).
    const permitidos = new Set(briefing.precos.map((p) => p.valorReais));
    const citados = valoresCitados(respostaAgente.texto);
    const inventados = citados.filter((v) => !permitidos.has(v));

    const rodada: RodadaSimulacao =
      inventados.length > 0
        ? {
            lead: falaDoLead.texto,
            agente:
              "Deixa eu confirmar esse valor com a equipe e já te retorno, pode ser? Não quero te passar número errado.",
            escalou: true,
            motivo: `a guarda derrubou R$ ${inventados.map((v) => v.toFixed(2)).join(", R$ ")} — não está no seu briefing`,
          }
        : { lead: falaDoLead.texto, agente: respostaAgente.texto, escalou: false };

    return { ok: true as const, rodada };
  });

/* ------------------------------------------------------- pagamentos */

/**
 * Cobra um uso avulso do saldo da carteira. Mesma mecânica de
 * wallet-server.ts: UPDATE condicional de uma instrução só, que "ganha"
 * apenas se afetar uma linha — é isso que protege contra duplo-clique e
 * duas abas, não um SELECT antes do UPDATE.
 */
export const debitarAvulso = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({
    agenteId: lerAgenteId((input as { agenteId?: unknown })?.agenteId),
  }))
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) return { ok: false as const, error: "Faça login para usar." };

    const limite = await checkGenerationRateLimit(userId);
    if (!limite.ok) return { ok: false as const, error: limite.error };

    const preco = plano(data.agenteId, "avulso").precoCents;
    const db = getDb();

    const [debito] = await db
      .update(users)
      .set({ balanceCents: sql`${users.balanceCents} - ${preco}` })
      .where(and(eq(users.id, userId), gte(users.balanceCents, preco)))
      .returning();

    if (!debito) return { ok: false as const, error: "insufficient_funds" as const };

    await db.insert(ledgerEntries).values({
      userId,
      deltaCents: -preco,
      reason: `agente:${data.agenteId}:avulso`,
    });

    return { ok: true as const, balanceCents: debito.balanceCents };
  });

/**
 * Contrata mensal ou anual pagando com o saldo da carteira.
 *
 * Por que saldo e não assinatura recorrente do Mercado Pago: recorrência
 * exige webhook de ciclo, tratamento de falha de cobrança e cancelamento —
 * infraestrutura que este projeto ainda não tem. Debitar da carteira usa o
 * caminho de pagamento que JÁ funciona em produção (depósito via Checkout
 * Pro + webhook), e o período vence sozinho em `expiraEm`. Renovação é um
 * novo débito, explícito. Isso é menos cômodo e muito mais honesto do que
 * anunciar recorrência que não existe.
 */
export const contratarPlano = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { agenteId?: unknown; planoId?: unknown };
    const planoId = data?.planoId;
    if (planoId !== "mensal" && planoId !== "anual") throw new Error("Plano inválido.");
    return { agenteId: lerAgenteId(data?.agenteId), planoId: planoId as PlanoId };
  })
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) return { ok: false as const, error: "Faça login para contratar." };

    const escolhido = plano(data.agenteId, data.planoId);
    const db = getDb();

    const [debito] = await db
      .update(users)
      .set({ balanceCents: sql`${users.balanceCents} - ${escolhido.precoCents}` })
      .where(and(eq(users.id, userId), gte(users.balanceCents, escolhido.precoCents)))
      .returning();

    if (!debito) return { ok: false as const, error: "insufficient_funds" as const };

    await db.insert(ledgerEntries).values({
      userId,
      deltaCents: -escolhido.precoCents,
      reason: `agente:${data.agenteId}:${data.planoId}`,
    });

    const dias = data.planoId === "anual" ? 365 : 30;
    const expiraEm = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

    // Contratar sobrescreve o teste em curso: é a mesma linha (userId,
    // agenteId), promovida de "teste" para "ativa".
    await db
      .insert(agenteAssinaturas)
      .values({
        userId,
        agenteId: data.agenteId,
        status: "ativa",
        plano: data.planoId as "mensal" | "anual",
        expiraEm,
      })
      .onConflictDoUpdate({
        target: [agenteAssinaturas.userId, agenteAssinaturas.agenteId],
        set: {
          status: "ativa",
          plano: data.planoId as "mensal" | "anual",
          expiraEm,
          atualizadoEm: new Date(),
        },
      });

    return {
      ok: true as const,
      expiraEm: expiraEm.toISOString(),
      balanceCents: debito.balanceCents,
    };
  });

/* ---------------------------------------------- Veronica Analytics */

/**
 * Os três tempos do Analytics, na ordem que o afiliado vive:
 *   1. a Veronica entrevista e RECOMENDA a oferta (recomendarOferta)
 *   2. ele escolhe e ela GERA o criativo pronto (gerarKitCriativo)
 *   3. o link sai carimbado com o código dele, e o clique é medido
 *      (buildTrackedPath, em affiliate-products.ts — já existia)
 *
 * O catálogo é o mesmo de /veronica-analytics: affiliate-products.json e
 * trending-videos.json. Não há uma segunda lista de ofertas aqui — duas
 * listas divergiriam no primeiro ciclo de atualização.
 */

export type PerfilAfiliado = {
  nicho: string;
  seguidores: string;
  estilo: string;
};

export type OfertaRecomendada = {
  produtoId: string;
  nome: string;
  porque: string;
};

/**
 * A Veronica lê o perfil do afiliado e ordena o catálogo para ele.
 *
 * O modelo NÃO inventa produto: ele recebe a lista real e devolve ids dela.
 * Um id que não existe no catálogo é descartado na volta — mesma postura da
 * guarda de preço, aplicada a nome de produto.
 */
export const recomendarOferta = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { nicho?: unknown; seguidores?: unknown; estilo?: unknown };
    const texto = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const perfil: PerfilAfiliado = {
      nicho: texto(data?.nicho),
      seguidores: texto(data?.seguidores, 40),
      estilo: texto(data?.estilo),
    };
    if (!perfil.nicho) throw new Error("Diga pelo menos o seu nicho.");
    return perfil;
  })
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) return { ok: false as const, error: "Faça login para receber a recomendação." };

    const limite = await checkGenerationRateLimit(userId);
    if (!limite.ok) return { ok: false as const, error: limite.error };

    const { affiliateProducts } = await import("./affiliate-products");
    if (affiliateProducts.length === 0) {
      return { ok: false as const, error: "Nenhuma oferta disponível no catálogo agora." };
    }

    const catalogo = affiliateProducts
      .map((p) => `- id: ${p.id} | ${p.name} | categoria: ${p.category} | ${p.angle}`)
      .join("\n");

    const system = `Você recomenda, para um afiliado, quais ofertas do catálogo abaixo ele deve divulgar.

CATÁLOGO (use SOMENTE estes ids):
${catalogo}

Escolha no máximo 3, da mais para a menos aderente ao perfil. Em "porque", seja concreto sobre o PERFIL dele — nada de elogio genérico. Uma frase por oferta.

Responda SOMENTE com JSON, sem cercas de código:
{"ofertas":[{"produtoId":"","porque":""}]}`;

    const resposta = await responderComCadeia(system, [
      {
        role: "user",
        content: `Nicho: ${data.nicho}\nTamanho do público: ${data.seguidores || "não informado"}\nEstilo de conteúdo: ${data.estilo || "não informado"}`,
      },
    ]);
    if (!resposta.ok) return { ok: false as const, error: resposta.erro };

    const limpo = resposta.texto.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "");
    const inicio = limpo.indexOf("{");
    const fim = limpo.lastIndexOf("}");
    if (inicio < 0 || fim <= inicio) {
      return { ok: false as const, error: "Não consegui montar a recomendação. Tente de novo." };
    }

    let ofertas: OfertaRecomendada[] = [];
    try {
      const bruto = JSON.parse(limpo.slice(inicio, fim + 1)) as {
        ofertas?: { produtoId?: unknown; porque?: unknown }[];
      };
      ofertas = (bruto.ofertas ?? [])
        .map((o) => {
          // Só passa id que existe de verdade no catálogo.
          const produto = affiliateProducts.find((p) => p.id === o?.produtoId);
          if (!produto) return null;
          return {
            produtoId: produto.id,
            nome: produto.name,
            porque: typeof o?.porque === "string" ? o.porque : produto.angle,
          };
        })
        .filter((o): o is OfertaRecomendada => o !== null)
        .slice(0, 3);
    } catch {
      return { ok: false as const, error: "Não consegui montar a recomendação. Tente de novo." };
    }

    if (ofertas.length === 0) {
      return { ok: false as const, error: "Nenhuma oferta do catálogo casou com esse perfil." };
    }
    return { ok: true as const, ofertas };
  });

export type KitCriativo = {
  gancho: string;
  roteiro: { segundos: string; acao: string; fala: string }[];
  legenda: string;
  hashtags: string[];
};

/**
 * Gera o criativo pronto para a oferta escolhida: gancho, roteiro cena a
 * cena, legenda e hashtags.
 *
 * COBRANÇA. Quem tem plano do Analytics gera à vontade; quem não tem paga o
 * avulso, debitado ANTES da chamada ao modelo e estornado se ela falhar —
 * mesma ordem de generateNanoBanana em wallet-server.ts, e pelo mesmo
 * motivo: ninguém paga por geração que não aconteceu, e ninguém gera de
 * graça quando o provedor cai no meio.
 */
export const gerarKitCriativo = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const produtoId = (input as { produtoId?: unknown })?.produtoId;
    if (typeof produtoId !== "string" || !produtoId.trim()) throw new Error("Oferta inválida.");
    return { produtoId: produtoId.trim() };
  })
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) return { ok: false as const, error: "Faça login para gerar o kit." };

    const limite = await checkGenerationRateLimit(userId);
    if (!limite.ok) return { ok: false as const, error: limite.error };

    const { affiliateProducts } = await import("./affiliate-products");
    const produto = affiliateProducts.find((p) => p.id === data.produtoId);
    if (!produto) return { ok: false as const, error: "Essa oferta não está no catálogo." };

    const acesso = await exigirAcesso(userId, "analytics-afiliado");
    const preco = plano("analytics-afiliado", "avulso").precoCents;
    const db = getDb();
    let cobrado = false;

    if (!acesso.ok) {
      const [debito] = await db
        .update(users)
        .set({ balanceCents: sql`${users.balanceCents} - ${preco}` })
        .where(and(eq(users.id, userId), gte(users.balanceCents, preco)))
        .returning();
      if (!debito) return { ok: false as const, error: "insufficient_funds" as const };
      cobrado = true;
      await db.insert(ledgerEntries).values({
        userId,
        deltaCents: -preco,
        reason: "agente:analytics-afiliado:kit",
      });
    }

    const system = `Você escreve criativo de vídeo curto (TikTok/Reels) para um afiliado vender um produto.

PRODUTO: ${produto.name}
POR QUE FUNCIONA EM VÍDEO: ${produto.angle}
FAIXA DE PREÇO: ${produto.priceLabel}

Regras:
- o gancho tem que segurar nos 2 primeiros segundos, sem "oi gente"
- o roteiro cabe em 15 a 25 segundos, em 3 a 5 cenas
- a fala é de gente falando, não de locução publicitária
- a legenda tem no máximo 2 linhas e termina chamando pro link
- 8 hashtags, sem "#fyp" nem "#viral"

Responda SOMENTE com JSON, sem cercas de código:
{"gancho":"","roteiro":[{"segundos":"0-3","acao":"","fala":""}],"legenda":"","hashtags":[]}`;

    const resposta = await responderComCadeia(system, [
      { role: "user", content: `Monte o criativo para: ${produto.name}` },
    ]);

    if (!resposta.ok) {
      if (cobrado) {
        await db
          .update(users)
          .set({ balanceCents: sql`${users.balanceCents} + ${preco}` })
          .where(eq(users.id, userId));
        await db.insert(ledgerEntries).values({
          userId,
          deltaCents: preco,
          reason: "refund:agente:analytics-afiliado:kit",
        });
      }
      return { ok: false as const, error: resposta.erro };
    }

    const limpo = resposta.texto.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "");
    const inicio = limpo.indexOf("{");
    const fim = limpo.lastIndexOf("}");
    let kit: KitCriativo | null = null;
    if (inicio >= 0 && fim > inicio) {
      try {
        const bruto = JSON.parse(limpo.slice(inicio, fim + 1)) as Partial<KitCriativo>;
        kit = {
          gancho: typeof bruto.gancho === "string" ? bruto.gancho : "",
          roteiro: Array.isArray(bruto.roteiro)
            ? bruto.roteiro.map((c) => ({
                segundos: String((c as { segundos?: unknown })?.segundos ?? ""),
                acao: String((c as { acao?: unknown })?.acao ?? ""),
                fala: String((c as { fala?: unknown })?.fala ?? ""),
              }))
            : [],
          legenda: typeof bruto.legenda === "string" ? bruto.legenda : "",
          hashtags: Array.isArray(bruto.hashtags) ? bruto.hashtags.map(String).slice(0, 12) : [],
        };
      } catch {
        kit = null;
      }
    }

    if (!kit || !kit.gancho || kit.roteiro.length === 0) {
      if (cobrado) {
        await db
          .update(users)
          .set({ balanceCents: sql`${users.balanceCents} + ${preco}` })
          .where(eq(users.id, userId));
        await db.insert(ledgerEntries).values({
          userId,
          deltaCents: preco,
          reason: "refund:agente:analytics-afiliado:kit",
        });
      }
      return { ok: false as const, error: "O criativo veio incompleto. Tente de novo." };
    }

    return { ok: true as const, kit, cobrado };
  });
