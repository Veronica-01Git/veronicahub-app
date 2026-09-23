/**
 * Leitura operacional, determinística e somente interna das conversas.
 *
 * Esta camada NÃO responde cliente, NÃO chama modelo e NÃO conhece a Meta.
 * Ela transforma o texto já disponível em um resumo verificável para o
 * painel: intenção, dados encontrados, dados que ainda faltam e necessidade
 * de validação humana.
 *
 * Por ser conservadora, prefere deixar um campo ausente a completar por
 * semelhança. O resultado orienta a equipe; não confirma preço, agenda ou
 * disponibilidade.
 */

import {
  CIDADES,
  REGRAS_EXPRESS_ENTULHO,
  buscarPreco,
  type CidadeId,
  type MaterialId,
  type ProdutoId,
} from "./whatsapp-rules";

export type IntencaoOperacional =
  | "orcamento"
  | "agendamento"
  | "troca"
  | "retirada"
  | "prorrogacao"
  | "alteracao-cancelamento"
  | "atraso-problema"
  | "pagamento-documento"
  | "informacao"
  | "indefinida";

export type CampoOperacional =
  | "material"
  | "cidade"
  | "bairro"
  | "produto"
  | "quando"
  | "endereco"
  | "dias-prorrogacao"
  | "referencia-pedido";

export type DadoOperacional = {
  readonly campo: CampoOperacional;
  readonly rotulo: string;
  readonly valor: string;
};

export type LeituraOperacional = {
  readonly versao: 1;
  readonly intencao: IntencaoOperacional;
  readonly rotuloIntencao: string;
  readonly dados: readonly DadoOperacional[];
  readonly faltantes: readonly CampoOperacional[];
  readonly exigeHumano: boolean;
  readonly motivoHumano: string | null;
  readonly confianca: "alta" | "media" | "baixa";
};

const ROTULO_INTENCAO: Record<IntencaoOperacional, string> = {
  orcamento: "Solicitar orçamento",
  agendamento: "Agendar caçamba",
  troca: "Trocar caçamba",
  retirada: "Solicitar retirada",
  prorrogacao: "Prorrogar permanência",
  "alteracao-cancelamento": "Alterar ou cancelar pedido",
  "atraso-problema": "Atraso ou problema operacional",
  "pagamento-documento": "Pagamento ou documento",
  informacao: "Pedir informação",
  indefinida: "Intenção ainda não definida",
};

const ROTULO_PRODUTO: Record<ProdutoId, string> = {
  "cacamba-menor": "Caçamba menor",
  "cacamba-grande": "Caçamba grande",
  tambor: "Tambor",
};

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function contem(texto: string, termos: readonly string[]): boolean {
  return termos.some((termo) => texto.includes(termo));
}

function detectarIntencao(texto: string): IntencaoOperacional {
  // A ordem é parte da regra. "Cancelar a retirada" continua sendo
  // cancelamento; "caminhão atrasou para retirar" continua sendo problema.
  if (contem(texto, ["cancel", "desmarc", "reagend", "mudar o pedido", "alterar o pedido"])) {
    return "alteracao-cancelamento";
  }
  if (
    contem(texto, [
      "nao chegou",
      "nao veio",
      "esta atrasado",
      "esta atrasada",
      "demorando",
      "cade o caminhao",
      "onde esta o caminhao",
      "problema",
      "reclam",
    ])
  ) {
    return "atraso-problema";
  }
  if (
    contem(texto, [
      "prorrog",
      "dias a mais",
      "mais uns dias",
      "deixar mais dias",
      "ficar mais dias",
    ]) ||
    /\bmais\s+\d{1,2}\s+dias?\b/.test(texto)
  ) {
    return "prorrogacao";
  }
  if (contem(texto, ["trocar a cacamba", "troca da cacamba", "cacamba encheu", "ja encheu"])) {
    return "troca";
  }
  if (contem(texto, ["retirar", "retirada", "recolher", "recolha", "buscar a cacamba"])) {
    return "retirada";
  }
  if (
    contem(texto, ["pix", "boleto", "comprovante", "pagamento", "nota fiscal", "nota de servico"])
  ) {
    return "pagamento-documento";
  }
  if (
    contem(texto, [
      "desconto",
      "melhor preco",
      "quanto custa",
      "qual o valor",
      "orcamento",
      "preco",
    ])
  ) {
    return "orcamento";
  }
  if (
    contem(texto, [
      "quero uma cacamba",
      "preciso de uma cacamba",
      "reservar",
      "agendar",
      "pode ser amanha",
      "para hoje",
    ])
  ) {
    return "agendamento";
  }
  if (contem(texto, ["voces atendem", "qual horario", "como funciona", "quanto tempo fica"])) {
    return "informacao";
  }
  return "indefinida";
}

function detectarCidade(texto: string): CidadeId | null {
  // Maior nome primeiro: Balneário Camboriú contém "Camboriú".
  const ordenadas = [...CIDADES].sort((a, b) => b.rotulo.length - a.rotulo.length);
  return ordenadas.find((cidade) => texto.includes(normalizar(cidade.rotulo)))?.id ?? null;
}

function detectarMateriais(texto: string): readonly MaterialId[] {
  return REGRAS_EXPRESS_ENTULHO.materiais
    .filter((material) => texto.includes(normalizar(material.rotulo)))
    .map((material) => material.id);
}

function detectarProduto(texto: string): ProdutoId | null {
  if (contem(texto, ["cacamba grande", "grande"])) return "cacamba-grande";
  if (contem(texto, ["cacamba menor", "menor"])) return "cacamba-menor";
  if (contem(texto, ["tambor"])) return "tambor";
  return null;
}

function detectarQuando(textoOriginal: string): string | null {
  const texto = normalizar(textoOriginal);
  const relativo = texto.match(
    /\b(hoje|amanha|depois de amanha)(?:\s+(?:de|pela|a)\s+(manha|tarde|noite))?\b/,
  );
  if (relativo) return relativo[0] ?? null;

  const data = textoOriginal.match(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/);
  return data?.[0] ?? null;
}

function detectarDiasProrrogacao(texto: string): number | null {
  const candidatos = [...texto.matchAll(/\b(\d{1,2})\s*dias?\b/g)];
  if (candidatos.length === 0) return null;
  const ultimo = Number(candidatos[candidatos.length - 1]?.[1]);
  return Number.isInteger(ultimo) && ultimo > 0 ? ultimo : null;
}

function detectarReferencia(textoOriginal: string): string | null {
  const codigo = textoOriginal.match(/\b(?:CB|OS)\s*[-#:]?\s*[A-Z0-9-]*\d[A-Z0-9-]*\b/i);
  if (codigo?.[0]) return codigo[0];
  const numero = textoOriginal.match(
    /\b(?:pedido|loca[cç][aã]o)\s*(?:n[ºo.]?\s*)?[-#:]?\s*\d{2,16}\b/i,
  );
  return numero?.[0] ?? null;
}

function detectarEndereco(textoOriginal: string): string | null {
  // Só aceita marcadores explícitos. Nome de bairro solto não vira endereço.
  const trecho = textoOriginal.match(
    /\b(?:rua|r\.|avenida|av\.|rodovia|estrada)\s+[^\n,]{2,70}(?:,\s*\d{1,6})?/i,
  );
  return trecho?.[0]?.trim() ?? null;
}

function detectarBairro(textoOriginal: string): string | null {
  const bairro = textoOriginal.match(/\bbairro\s+([\p{L}][\p{L}\s'-]{1,48})/iu)?.[1]?.trim();
  if (!bairro) return null;
  // Encerra antes de marcadores que já pertencem a outro campo.
  return bairro.split(/\s+(?:em|na|no|para|amanh[aã]|hoje)\b/i)[0]?.trim() ?? null;
}

function camposObrigatorios(intencao: IntencaoOperacional): readonly CampoOperacional[] {
  switch (intencao) {
    case "orcamento":
      return ["material", "cidade", "produto"];
    case "agendamento":
      return ["material", "cidade", "produto", "quando", "endereco"];
    case "troca":
    case "retirada":
    case "alteracao-cancelamento":
      return ["referencia-pedido"];
    case "prorrogacao":
      return ["referencia-pedido", "dias-prorrogacao"];
    case "atraso-problema":
      return ["referencia-pedido"];
    case "pagamento-documento":
      return ["referencia-pedido"];
    case "informacao":
    case "indefinida":
      return [];
  }
}

export function analisarConversa(mensagens: readonly string[]): LeituraOperacional {
  const original = mensagens.filter(Boolean).join("\n").slice(0, 8_000);
  const texto = normalizar(original);
  const intencao = detectarIntencao(texto);
  const cidade = detectarCidade(texto);
  const materiais = detectarMateriais(texto);
  const produto = detectarProduto(texto);
  const quando = detectarQuando(original);
  const dias = detectarDiasProrrogacao(texto);
  const referencia = detectarReferencia(original);
  const endereco = detectarEndereco(original);
  const bairro = detectarBairro(original);

  const dados: DadoOperacional[] = [];
  if (materiais.length > 0) {
    dados.push({
      campo: "material",
      rotulo: materiais.length > 1 ? "Materiais" : "Material",
      valor: materiais
        .map((id) => REGRAS_EXPRESS_ENTULHO.materiais.find((m) => m.id === id)?.rotulo ?? id)
        .join(", "),
    });
  }
  if (cidade) {
    dados.push({
      campo: "cidade",
      rotulo: "Cidade",
      valor: CIDADES.find((c) => c.id === cidade)?.rotulo ?? cidade,
    });
  }
  if (bairro) dados.push({ campo: "bairro", rotulo: "Bairro", valor: bairro });
  if (produto) dados.push({ campo: "produto", rotulo: "Produto", valor: ROTULO_PRODUTO[produto] });
  if (quando) dados.push({ campo: "quando", rotulo: "Quando", valor: quando });
  if (endereco) dados.push({ campo: "endereco", rotulo: "Endereço", valor: endereco });
  if (dias) {
    dados.push({ campo: "dias-prorrogacao", rotulo: "Prorrogação", valor: `${dias} dias` });
  }
  if (referencia) {
    dados.push({ campo: "referencia-pedido", rotulo: "Referência", valor: referencia });
  }

  const presentes = new Set(dados.map((d) => d.campo));
  const faltantes = camposObrigatorios(intencao).filter((campo) => !presentes.has(campo));

  let exigeHumano = false;
  let motivoHumano: string | null = null;

  if (intencao === "alteracao-cancelamento") {
    exigeHumano = true;
    motivoHumano = "Alteração ou cancelamento exige validação operacional.";
  } else if (intencao === "atraso-problema") {
    exigeHumano = true;
    motivoHumano = "Problema em andamento exige conferir motorista, rota ou operação.";
  } else if (intencao === "pagamento-documento") {
    exigeHumano = true;
    motivoHumano = "Pagamento e documento não são confirmados automaticamente.";
  } else if (
    intencao === "prorrogacao" &&
    dias != null &&
    dias > REGRAS_EXPRESS_ENTULHO.prorrogacaoSemAprovacaoDias
  ) {
    exigeHumano = true;
    motivoHumano = `Prorrogação acima de ${REGRAS_EXPRESS_ENTULHO.prorrogacaoSemAprovacaoDias} dias.`;
  } else if (
    intencao === "orcamento" &&
    contem(texto, ["desconto", "melhor preco", "concorrente"])
  ) {
    exigeHumano = true;
    motivoHumano = "Negociação comercial exige aprovação humana.";
  } else if (intencao === "orcamento" && cidade && materiais.length === 1 && produto) {
    const preco = buscarPreco(REGRAS_EXPRESS_ENTULHO, produto, materiais[0], cidade);
    if (preco == null) {
      exigeHumano = true;
      motivoHumano = "A combinação ainda não tem preço confirmado.";
    }
  }

  const confianca = intencao === "indefinida" ? "baixa" : dados.length > 0 ? "alta" : "media";

  return {
    versao: 1,
    intencao,
    rotuloIntencao: ROTULO_INTENCAO[intencao],
    dados,
    faltantes,
    exigeHumano,
    motivoHumano,
    confianca,
  };
}

export const ROTULO_CAMPO_OPERACIONAL: Record<CampoOperacional, string> = {
  material: "material",
  cidade: "cidade",
  bairro: "bairro",
  produto: "tipo de caçamba",
  quando: "data ou período",
  endereco: "endereço da obra",
  "dias-prorrogacao": "quantidade de dias",
  "referencia-pedido": "pedido ou caçamba",
};
