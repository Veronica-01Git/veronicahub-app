import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader, SOCIAL_LINKS } from "@/components/SiteChrome";

export const Route = createFileRoute("/privacidade")({
  component: PoliticaDePrivacidade,
  head: () => ({
    meta: [
      { title: "Política de Privacidade | Veronica Hub" },
      {
        name: "description",
        content:
          "Como a Veronica Hub e a YO LAB & CO. tratam dados pessoais no site e nos agentes de atendimento por WhatsApp.",
      },
    ],
  }),
});

const ATUALIZADA_EM = "26 de setembro de 2026";
const EMAIL_CONTATO = SOCIAL_LINKS.email.replace("mailto:", "");

type Secao = { id: string; titulo: string; corpo: ReactNode };

const secoes: Secao[] = [
  {
    id: "quem-somos",
    titulo: "1. Quem é responsável pelos dados",
    corpo: (
      <p>
        Esta política vale para o site veronicahub.com e para os agentes de atendimento por WhatsApp
        desenvolvidos e operados pela Veronica Hub / YO LAB &amp; CO. Quando um agente atende em
        nome de uma empresa cliente (por exemplo, a Express Entulho), essa empresa decide para que o
        atendimento serve, e nós tratamos os dados em nome dela, conforme esta política e a Lei
        Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
      </p>
    ),
  },
  {
    id: "dados-coletados",
    titulo: "2. Quais dados coletamos",
    corpo: (
      <>
        <p>
          <strong>No atendimento por WhatsApp:</strong>
        </p>
        <ul>
          <li>o número de telefone e o nome de perfil do WhatsApp de quem nos escreve;</li>
          <li>
            o conteúdo das mensagens trocadas — texto, áudios e demais anexos enviados — e a data e
            hora de cada uma;
          </li>
          <li>
            informações que a própria pessoa informa na conversa para pedir um orçamento ou serviço,
            como endereço de entrega, bairro, cidade e tipo de material.
          </li>
        </ul>
        <p>
          <strong>No site:</strong> o e-mail usado para entrar na conta, dados de compras e
          pagamentos quando houver, e informações técnicas de acesso (endereço IP, navegador,
          páginas visitadas) registradas pela infraestrutura de hospedagem.
        </p>
      </>
    ),
  },
  {
    id: "finalidade",
    titulo: "3. Para que usamos os dados",
    corpo: (
      <ul>
        <li>responder às mensagens e dar andamento ao pedido de orçamento ou serviço;</li>
        <li>encaminhar a conversa a uma pessoa da equipe quando o agente não puder resolver;</li>
        <li>manter o histórico do atendimento, para que a equipe saiba o que já foi dito;</li>
        <li>corrigir falhas e melhorar a qualidade das respostas;</li>
        <li>cumprir obrigações legais.</li>
      </ul>
    ),
  },
  {
    id: "ia",
    titulo: "4. Uso de inteligência artificial",
    corpo: (
      <p>
        As respostas do atendimento são geradas por um agente de inteligência artificial. Áudios
        recebidos são transcritos automaticamente para texto, e algumas respostas podem ser enviadas
        em áudio gerado por voz sintética. Quando o agente não tem segurança sobre uma informação,
        como um valor, a conversa é encaminhada a uma pessoa da equipe. Não usamos o conteúdo das
        conversas para decisões automatizadas que produzam efeitos jurídicos sobre você.
      </p>
    ),
  },
  {
    id: "compartilhamento",
    titulo: "5. Com quem os dados são compartilhados",
    corpo: (
      <>
        <p>
          Não vendemos dados pessoais. Eles são tratados apenas pelos serviços necessários ao
          funcionamento:
        </p>
        <ul>
          <li>Meta (WhatsApp Business Platform), que entrega as mensagens;</li>
          <li>
            provedores de inteligência artificial que geram as respostas, transcrevem áudios e
            sintetizam voz;
          </li>
          <li>
            provedores de hospedagem e banco de dados onde o sistema roda e o histórico é guardado;
          </li>
          <li>processadores de pagamento, quando há compra no site;</li>
          <li>
            a empresa cliente atendida pelo agente, que recebe o histórico do próprio atendimento.
          </li>
        </ul>
        <p>
          Alguns desses provedores ficam fora do Brasil; nesses casos a transferência segue o que a
          LGPD permite para a prestação do serviço solicitado por você.
        </p>
      </>
    ),
  },
  {
    id: "retencao",
    titulo: "6. Por quanto tempo guardamos",
    corpo: (
      <p>
        Guardamos o histórico das conversas pelo tempo necessário para concluir o atendimento e
        prestar suporte sobre ele, ou pelo prazo exigido por lei. Depois disso, ou quando você pedir
        a exclusão, os dados são apagados.
      </p>
    ),
  },
  {
    id: "direitos",
    titulo: "7. Seus direitos",
    corpo: (
      <p>
        Você pode, a qualquer momento, pedir confirmação de que tratamos seus dados, acesso a eles,
        correção, anonimização, portabilidade, exclusão, informação sobre com quem foram
        compartilhados, e revogar consentimentos. Basta escrever para o contato indicado abaixo.
      </p>
    ),
  },
  {
    id: "exclusao-de-dados",
    titulo: "8. Como pedir a exclusão dos seus dados",
    corpo: (
      <>
        <p>Para apagar o histórico das suas conversas e demais dados:</p>
        <ol>
          <li>
            envie um e-mail para <a href={SOCIAL_LINKS.email}>{EMAIL_CONTATO}</a> com o assunto
            “Exclusão de dados”;
          </li>
          <li>informe o número de WhatsApp (com DDD) ou o e-mail usado no site;</li>
          <li>
            confirmaremos o pedido e concluiremos a exclusão em até 15 dias, avisando por e-mail
            quando terminar.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "seguranca",
    titulo: "9. Segurança",
    corpo: (
      <p>
        Usamos conexões criptografadas, verificação de assinatura nas mensagens recebidas do
        WhatsApp e acesso restrito aos sistemas. Nenhum sistema é totalmente imune a falhas; se
        ocorrer um incidente que possa trazer risco a você, avisaremos e comunicaremos a Autoridade
        Nacional de Proteção de Dados (ANPD) conforme a lei.
      </p>
    ),
  },
  {
    id: "contato",
    titulo: "10. Contato e alterações",
    corpo: (
      <p>
        Dúvidas ou pedidos sobre privacidade: <a href={SOCIAL_LINKS.email}>{EMAIL_CONTATO}</a>. Esta
        política pode ser atualizada; a data da versão vigente fica no topo desta página.
      </p>
    ),
  },
];

function PoliticaDePrivacidade() {
  return (
    <div className="home-hybrid min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <div className="font-mono-tech text-[11px] uppercase tracking-[.2em] text-neon-green">
          Veronica Hub · YO LAB &amp; CO.
        </div>
        <h1 className="mt-4 font-display text-4xl leading-tight tracking-[-.04em] sm:text-5xl">
          Política de Privacidade
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Última atualização: {ATUALIZADA_EM}</p>

        <nav
          aria-label="Seções"
          className="mt-10 rounded-sm border border-border/60 bg-surface/40 p-5"
        >
          <ol className="grid gap-1.5 text-sm">
            {secoes.map((secao) => (
              <li key={secao.id}>
                <a href={`#${secao.id}`} className="text-muted-foreground hover:text-neon-green">
                  {secao.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-12">
          {secoes.map((secao) => (
            <section key={secao.id} id={secao.id} className="scroll-mt-24">
              <h2 className="font-display text-2xl tracking-[-.03em]">{secao.titulo}</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground [&_a]:text-neon-green [&_a]:underline [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-6">
                {secao.corpo}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
