/**
 * Quem pode abrir o endereço oficial de um cliente.
 *
 * O painel de operações da Express Entulho é o **endereço oficial** dela no
 * Hub, e por decisão de 22/09 só o dono do selo entra. Até aqui a rota era
 * pública e indexável — o que fazia sentido enquanto era vitrine de
 * protótipo, e deixou de fazer no momento em que virou o espaço do cliente.
 *
 * COMO A AUTORIZAÇÃO FUNCIONA, e por que assim:
 *
 * O acesso é por **identidade**, não por segredo compartilhado. O dono entra
 * com o login que o Hub já tem (código por e-mail) e o e-mail dele precisa
 * estar liberado para aquele selo. Link vazado não abre nada, que é a única
 * forma de "somente o dono" ser verdade em vez de figura de linguagem.
 *
 * OS E-MAILS NÃO FICAM NO CÓDIGO. Vêm de variável de ambiente, uma por selo,
 * seguindo o mesmo padrão de `ADMIN_EMAILS` que este repositório já usa. Dois
 * motivos: e-mail de cliente é dado pessoal e não entra em commit; e liberar
 * ou revogar acesso passa a ser mudança de configuração, sem deploy.
 *
 * DUAS PORTAS DE SERVIÇO, e elas existem por necessidade real:
 *
 * 1. **Acesso universal** (`ACESSO_UNIVERSAL`): o e-mail de quem desenvolve e
 *    dá suporte abre o painel de QUALQUER cliente. Sem isso, a primeira
 *    dúvida de um cliente vira um pedido para afrouxar o acesso dele — que é
 *    como proteção morre na prática.
 * 2. **Admin do Hub** (`ADMIN_EMAILS`, que este repo já usa): também passa.
 *
 * Os dois são por variável de ambiente, e **nenhum e-mail está escrito neste
 * arquivo**. Não é preciosismo: repositório é lugar de leitura ampla, e
 * e-mail em commit fica indexado e raspado para sempre. Em configuração, ele
 * é revogável sem deploy e não vira alvo de spam.
 *
 * O QUE ESTE PORTÃO **NÃO** PROTEGE, e está escrito aqui para ninguém se
 * enganar depois: os dados do painel hoje são um mock que viaja no pacote
 * JavaScript do navegador (`src/features/express-ops-b/data/mock.ts`). Então
 * o portão fecha a PÁGINA, não o dado — quem souber ler um bundle acha o
 * mock. Isso é aceitável agora porque o mock é inteiramente fictício, e é a
 * razão de existir a tarja "dados fictícios" em todas as telas.
 *
 * **No dia em que entrar dado real de operação, ele tem de vir por server
 * function chamando esta verificação — nunca do bundle.** Página protegida
 * com dado real embutido no navegador é vazamento com cara de segurança.
 */

import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "./schema";
import { getSessionUserId } from "./session";
import { requireAdminCore } from "./admin-core.server";

/**
 * Selo → variável de ambiente com os e-mails liberados.
 *
 * É um mapa explícito, e não um nome de variável montado a partir do selo,
 * porque montar nome de variável dinamicamente esconde de qualquer busca
 * quais acessos existem. Aqui um `grep` responde.
 */
const VARIAVEL_POR_SELO: Record<string, string> = {
  "VH-AUT-WA-2026-000001": "ACESSO_EXPRESS_ENTULHO",
};

function listaDeEmails(variavel: string | undefined): string[] {
  if (!variavel) return [];
  return (process.env[variavel] ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function emailsLiberados(serial: string): string[] {
  return listaDeEmails(VARIAVEL_POR_SELO[serial]);
}

/** Abre o painel de qualquer cliente — quem desenvolve e dá suporte. */
function temAcessoUniversal(email: string): boolean {
  return listaDeEmails("ACESSO_UNIVERSAL").includes(email.toLowerCase());
}

import type { Autorizacao } from "./acesso-cliente-server";

/** Núcleo da verificação. Separado da server function para poder ser testado. */
export async function verificarAcessoCliente(serial: string): Promise<Autorizacao> {
  const admin = await requireAdminCore();
  if (admin) return { ok: true, via: "admin", email: admin.email };

  const userId = await getSessionUserId();
  if (!userId) return { ok: false, motivo: "sem-sessao" };

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { ok: false, motivo: "sem-sessao" };

  const email = user.email.toLowerCase();
  if (temAcessoUniversal(email)) return { ok: true, via: "universal", email: user.email };
  if (emailsLiberados(serial).includes(email)) {
    return { ok: true, via: "dono", email: user.email };
  }
  return { ok: false, motivo: "sem-permissao" };
}
