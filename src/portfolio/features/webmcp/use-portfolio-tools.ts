import { useEffect } from "react";
import { SUPPORTED_PROFESSIONS } from "../../config/sections";
import {
  createPortfolioTools,
  registerPortfolioTools,
  type PortfolioBrief,
  type PortfolioModelContext,
} from "./tools";

export function usePortfolioTools(
  proposeBrief: (brief: PortfolioBrief) => void,
) {
  useEffect(() => {
    // Current WebMCP trial API (September 2026). Do not install a global
    // polyfill or expose these tools to third-party origins.
    const context = (
      document as Document & { modelContext?: PortfolioModelContext }
    ).modelContext;
    if (!context || typeof context.registerTool !== "function") return;
    return registerPortfolioTools(
      context,
      createPortfolioTools(SUPPORTED_PROFESSIONS, (brief) => {
        proposeBrief(brief);
        document.getElementById("create")?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
          block: "start",
        });
      }),
    );
  }, [proposeBrief]);
}
