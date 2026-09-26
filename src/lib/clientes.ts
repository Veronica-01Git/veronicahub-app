/**
 * As entregas navegáveis de cada cliente, por número de série do selo.
 *
 * Mora aqui, e não dentro da rota /clientes, por um motivo que o teste de
 * rota órfã torna concreto: a varredura de tests/agentes.test.mjs precisa
 * saber quais rotas têm link. Se este mapa vivesse no .tsx da página, o teste
 * não o enxergaria, e as sete rotas do Express Operations teriam de entrar na
 * lista de exceções — declaradas como "sem link de propósito" quando na
 * verdade TÊM link. A exceção mentiria, e exceção que mente é pior que rota
 * órfã, porque some do radar.
 *
 * Fica fora de `seals.ts` pela razão inversa: selo é registro de procedência
 * e não deve saber de rota do site. Esta é a camada de navegação, e ela
 * referencia o selo — nunca o contrário.
 */

export type EntregaDeCliente = {
  readonly to: string;
  readonly rotulo: string;
  readonly descricao: string;
  /**
   * Pode aparecer na vitrine pública?
   *
   * A central de operações é espaço privado do cliente — mostrá-la em página
   * aberta é convidar o visitante para uma porta que vai recusá-lo. Quem é
   * cliente chega nela pelo portal /clientes, com o número do selo.
   */
  readonly publica: boolean;
};

export const ENTREGAS_POR_SELO: Record<string, readonly EntregaDeCliente[]> = {
  "VH-AUT-WA-2026-000001": [
    {
      to: "/clientes/express-entulho/operacoes",
      rotulo: "Central de operações",
      descricao: "Painel de atendimento, aprovações, frota e regras do agente",
      publica: false,
    },
    {
      to: "/clientes/express-entulho/proposta",
      rotulo: "Proposta",
      descricao: "Escopo, etapas e condições da implantação",
      publica: true,
    },
  ],
  "VH-MEM-2026-000002": [
    {
      to: "/clientes/lz-team",
      rotulo: "Página do LZ Training Club",
      descricao: "Página pública do Coach Lucas Tomaz: método, trajetória e aplicação",
      publica: true,
    },
    {
      to: "/clientes/lz-team/painel",
      rotulo: "Ambiente privado",
      descricao: "Workspace do LZ Team, com entrada pelo selo",
      publica: false,
    },
  ],
};

/** Todo destino alcançável a partir das páginas de cliente. */
export const LINKS_DE_CLIENTES: readonly string[] = Object.values(ENTREGAS_POR_SELO)
  .flat()
  .map((e) => e.to);

/** Só o que a vitrine pública pode mostrar. */
export function entregasPublicas(serial: string): readonly EntregaDeCliente[] {
  return (ENTREGAS_POR_SELO[serial] ?? []).filter((e) => e.publica);
}
