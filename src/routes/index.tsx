import { createFileRoute } from "@tanstack/react-router";
import { CampusNavigation } from "@/components/learning/CampusVisuals";
import { useCallback, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { BuildWorkforce } from "@/components/home/workforce/BuildWorkforce";
import { EnterpriseWorkforce } from "@/components/home/workforce/EnterpriseWorkforce";
import { Implementations } from "@/components/home/workforce/Implementations";
import { Industries } from "@/components/home/workforce/Industries";
import { InsideVeronica } from "@/components/home/workforce/InsideVeronica";
import { LiveNetwork } from "@/components/home/workforce/LiveNetwork";
import { PlatformIndex } from "@/components/home/workforce/PlatformIndex";
import { WorkforceHero } from "@/components/home/workforce/WorkforceHero";
import { WorkforceStore } from "@/components/home/workforce/WorkforceStore";
import { YoLab } from "@/components/home/workforce/YoLab";
import { useWireSignal } from "@/components/home/workforce/useWireSignal";
import type { AgenteWorkforceId } from "@/lib/ai-workforce";

/**
 * HOME — Veronica · AI Workforce Platform (01/10/2026).
 *
 * A Home apresenta uma empresa digital operada por agentes: a Veronica é a
 * inteligência central, os agentes são a força de trabalho, o Hub é onde
 * eles já trabalham e a YO LAB & CO. é o laboratório que os constrói.
 *
 * Tudo o que a página afirma vem de src/lib/ai-workforce.ts (que deriva de
 * ecosystem.ts, agentes.ts e seals.ts). O único dado vivo é o feed público
 * do Wire TV. Não há métrica inventada, percentual de automação, valuation
 * nem cliente sugerido — tests/ai-workforce.test.mjs guarda essas regras.
 *
 * A Home anterior (ecossistema comercial) está preservada, inteira, em
 * src/components/home/EcosystemHome.tsx.
 */

const TITULO = "Veronica · AI Workforce Platform";
const DESCRICAO =
  "Inteligência artificial especializada para operar funções reais de empresas. Agentes com função, rota, painel e prova — construídos e validados pela YO LAB & CO. dentro da própria Veronica Hub.";

export const Route = createFileRoute("/")({
  component: WorkforceHome,
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { name: "twitter:title", content: TITULO },
      { name: "twitter:description", content: DESCRICAO },
      { property: "og:image", content: "https://veronicahub.com/images/brand/yo-lab-logo.webp" },
      { name: "twitter:image", content: "https://veronicahub.com/images/brand/yo-lab-logo.webp" },
      { name: "theme-color", content: "#1a1d1e" },
    ],
    links: [
      // Campus YO com a identidade canônica da Veronica.
      {
        rel: "preload",
        as: "image",
        href: "/images/veronica/veronica-hero-static.webp",
        type: "image/webp",
        fetchPriority: "high",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "YO LAB & CO. / Veronica Hub",
          url: "https://veronicahub.com",
          description:
            "Laboratório de inteligência artificial que constrói, opera e implanta agentes especializados para funções de empresas.",
        }),
      },
    ],
  }),
});

function WorkforceHome() {
  const sinal = useWireSignal();
  const [selecionados, setSelecionados] = useState<ReadonlySet<AgenteWorkforceId>>(new Set());

  const alternar = useCallback((id: AgenteWorkforceId) => {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }, []);

  // "Implementar" na vitrine sempre MARCA (nunca desmarca) o agente na proposta.
  const marcar = useCallback((id: AgenteWorkforceId) => {
    setSelecionados((atual) => (atual.has(id) ? atual : new Set(atual).add(id)));
  }, []);

  return (
    <div className="vh-wf yo-home min-h-screen">
      <SiteHeader brand="yo" />
      <main>
        <WorkforceHero sinal={sinal} />
        <LiveNetwork sinal={sinal} />
        <WorkforceStore aoImplementar={marcar} />
        <InsideVeronica />
        <EnterpriseWorkforce />
        <Industries />
        <Implementations />
        <YoLab />
        <BuildWorkforce selecionados={selecionados} alternar={alternar} />
        <PlatformIndex />
        <CampusNavigation />
      </main>
      <SiteFooter brand="yo" tagline="O laboratório por trás da Veronica AI Workforce." />
    </div>
  );
}
