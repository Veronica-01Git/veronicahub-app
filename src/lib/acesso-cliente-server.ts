/**
 * Ponte entre o navegador e a verificação de acesso do cliente.
 *
 * POR QUE ESTE ARQUIVO EXISTE, e é uma lição que custou uma tela quebrada:
 * a primeira versão punha a `createServerFn` junto do núcleo, no mesmo
 * arquivo que importa sessão e banco. O `tsc` passou, o `npm run build`
 * passou — e a página morria no navegador, porque o Vite (com razão) recusa
 * importar código de servidor dentro de componente de cliente.
 *
 * O padrão correto já existia neste repositório, em `admin-server.ts`: o
 * módulo de servidor entra por `import()` DENTRO do handler. Assim ele é
 * resolvido só quando a função roda no servidor, e nunca vai para o pacote
 * que o navegador baixa.
 *
 * O tipo é reexportado aqui para a tela não precisar tocar no core.
 */

import { createServerFn } from "@tanstack/react-start";

export type Autorizacao =
  | {
      readonly ok: true;
      /** Como entrou: dono do selo, acesso universal ou admin do Hub. */
      readonly via: "dono" | "universal" | "admin";
      readonly email: string;
    }
  | { readonly ok: false; readonly motivo: "sem-sessao" | "sem-permissao" };

/**
 * Devolve só o veredito e o e-mail de quem entrou — nunca a lista de
 * liberados. Quem não tem acesso não precisa descobrir quem tem.
 */
export const autorizarAcessoCliente = createServerFn({ method: "GET" })
  .inputValidator((serial: string) => serial)
  .handler(async ({ data: serial }): Promise<Autorizacao> => {
    const { verificarAcessoCliente } = await import("./acesso-cliente-core.server");
    return verificarAcessoCliente(serial);
  });
