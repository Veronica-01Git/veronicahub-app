import { type UniverseTab } from "./types";

interface NavItem {
  id: UniverseTab;
  label: string;
  functional: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "00", label: "00 / OVERVIEW", functional: true },
  { id: "01", label: "01 / ESSENCE", functional: false },
  { id: "02", label: "02 / ECOSYSTEM", functional: true },
  { id: "03", label: "03 / CHARACTER", functional: false },
  { id: "04", label: "04 / VISUAL SYSTEM", functional: false },
  { id: "05", label: "05 / VOICE", functional: false },
  { id: "06", label: "06 / MEDIA", functional: false },
  { id: "07", label: "07 / PROMPT LAB", functional: false },
  { id: "08", label: "08 / DECISIONS", functional: false },
];

interface UniverseNavigationProps {
  activeTab: UniverseTab;
  onSelectTab: (tab: UniverseTab) => void;
}

export function UniverseNavigation({ activeTab, onSelectTab }: UniverseNavigationProps) {
  return (
    <nav
      data-universe-element="nav"
      className="sticky top-0 z-30 -mx-4 border-y border-border/40 bg-background/85 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6"
      aria-label="Navegação interna do Veronica Universe"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`group relative flex shrink-0 items-center gap-2 rounded-sm px-3 py-1.5 font-mono-tech text-[11px] tracking-wider transition ${
                isActive
                  ? "bg-surface-elevated text-neon-green border border-neon-green/40 shadow-xs"
                  : "text-muted-foreground hover:bg-surface/40 hover:text-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="font-medium">{item.label}</span>

              {!item.functional && (
                <span className="rounded bg-muted/40 px-1 py-0.2 text-[8px] tracking-normal text-muted-foreground uppercase">
                  DEV
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
