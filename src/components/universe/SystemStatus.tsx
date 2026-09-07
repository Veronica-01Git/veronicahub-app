import { Activity, Cpu } from "lucide-react";

interface StatusItem {
  key: string;
  label: string;
  status: "ACTIVE" | "MAPPED" | "IN DEVELOPMENT" | "WAITING" | "OFFLINE";
  variant: "green" | "cyan" | "neutral";
}

const SYSTEM_STATUS_DATA: StatusItem[] = [
  { key: "core", label: "IDENTITY CORE", status: "ACTIVE", variant: "green" },
  { key: "essence", label: "ESSENCE CANON", status: "ACTIVE", variant: "green" },
  { key: "eco", label: "ECOSYSTEM", status: "MAPPED", variant: "cyan" },
  { key: "char", label: "CHARACTER", status: "IN DEVELOPMENT", variant: "neutral" },
  { key: "vis", label: "VISUAL SYSTEM", status: "IN DEVELOPMENT", variant: "neutral" },
  { key: "voice", label: "VOICE", status: "IN DEVELOPMENT", variant: "neutral" },
  { key: "prompt", label: "PROMPT LAB", status: "WAITING", variant: "neutral" },
  { key: "guardian", label: "GUARDIAN", status: "OFFLINE", variant: "neutral" },
];

export function SystemStatus() {
  return (
    <section
      data-universe-element="status"
      className="my-10 rounded-sm border border-border/60 bg-surface/30 p-5 sm:p-7"
      aria-labelledby="system-status-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-neon-green" />
          <h2
            id="system-status-title"
            className="font-mono-tech text-xs tracking-widest text-foreground uppercase"
          >
            UNIVERSE STATUS & TELEMETRY
          </h2>
        </div>

        <div className="flex items-center gap-3 font-mono-tech text-[10px] tracking-wider text-muted-foreground">
          <span>KERNEL: RUNNING</span>
          <span className="text-border">·</span>
          <span>CANON: 01 ACTIVE</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {SYSTEM_STATUS_DATA.map((item) => {
          const badgeClass =
            item.variant === "green"
              ? "text-neon-green bg-neon-green/10 border-neon-green/30"
              : item.variant === "cyan"
                ? "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30"
                : "text-muted-foreground bg-muted/20 border-border/40";

          const dotClass =
            item.variant === "green"
              ? "bg-neon-green animate-pulse"
              : item.variant === "cyan"
                ? "bg-neon-cyan"
                : "bg-muted-foreground/60";

          return (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-sm border border-border/40 bg-background/50 px-3.5 py-2.5 font-mono-tech transition hover:border-border"
            >
              <span className="text-[11px] tracking-wider text-foreground/85">{item.label}</span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9.5px] tracking-widest uppercase font-medium ${badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                {item.status}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/30 pt-4 font-mono-tech text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <Cpu className="h-3 w-3" />
          <span>FOUNDATION: SHELL / ESSENCE CANON / CONSTELLATION MAP</span>
        </div>
        <div>TOTAL REGISTERED NODES: 08</div>
      </div>
    </section>
  );
}
