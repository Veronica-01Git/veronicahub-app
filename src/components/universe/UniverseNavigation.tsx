import { type UniverseTab } from "./types";

interface NavItem {
  id: UniverseTab;
  label: string;
  group: "CORE" | "SYSTEM" | "GOVERNANCE";
  functional: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "00", label: "TODAY", group: "CORE", functional: true },
  { id: "09", label: "MONEY", group: "CORE", functional: true },
  { id: "10", label: "CUSTOMERS", group: "CORE", functional: true },
  { id: "11", label: "FUNNELS", group: "CORE", functional: true },
  { id: "02", label: "ECOSYSTEM", group: "SYSTEM", functional: true },
  { id: "12", label: "HEALTH", group: "SYSTEM", functional: true },
  { id: "03", label: "CHARACTER", group: "GOVERNANCE", functional: true },
  { id: "08", label: "DECISIONS", group: "GOVERNANCE", functional: false },
];

interface UniverseNavigationProps {
  activeTab: UniverseTab;
  onSelectTab: (tab: UniverseTab) => void;
}

export function UniverseNavigation({ activeTab, onSelectTab }: UniverseNavigationProps) {
  return (
    <nav
      data-universe-element="nav"
      className="sticky top-[49px] z-30 -mx-4 border-y border-border/40 bg-background/88 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6"
      aria-label="Navegação interna do Veronica Universe"
    >
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {NAV_ITEMS.map((item, index) => {
          const isActive = activeTab === item.id;
          const previous = NAV_ITEMS[index - 1];
          const startsGroup = !previous || previous.group !== item.group;

          return (
            <div key={item.id} className="flex shrink-0 items-center gap-2">
              {startsGroup && index > 0 && (
                <span className="mx-1 h-5 w-px bg-border/50" aria-hidden />
              )}
              <button
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`group relative flex shrink-0 items-center gap-2 rounded-sm border px-3 py-1.5 font-mono-tech text-[10px] tracking-wider transition ${
                  isActive
                    ? "border-neon-green/40 bg-neon-green/8 text-neon-green"
                    : "border-transparent text-muted-foreground hover:border-border/50 hover:bg-surface/40 hover:text-foreground"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="text-[8px] text-muted-foreground/70">{item.id}</span>
                <span className="font-medium">{item.label}</span>
                {!item.functional && (
                  <span className="rounded border border-border/40 bg-muted/20 px-1 py-0.5 text-[7px] tracking-normal text-muted-foreground">
                    STRUCTURE
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
