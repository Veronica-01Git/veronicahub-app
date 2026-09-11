import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  LineChart,
  Newspaper,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import { INTENT_LINKS, type IntentId } from "@/lib/ecosystem";

const icons: Record<IntentId, typeof Wand2> = {
  learn: BookOpen,
  create: Wand2,
  sell: LineChart,
  protect: ShieldCheck,
  work: Briefcase,
  update: Newspaper,
};

export function IntentPortal() {
  return (
    <nav aria-label="Escolha por objetivo" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {INTENT_LINKS.map((intent) => {
        const Icon = icons[intent.id];
        return (
          <Link
            key={intent.id}
            to={intent.to}
            className="group flex min-h-40 flex-col justify-between rounded-md bg-surface/45 p-6 transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="flex items-start justify-between">
              <Icon className="h-6 w-6 text-neon-green" />
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neon-green" />
            </div>
            <div className="mt-8">
              <h3 className="font-display text-xl">{intent.label}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{intent.tag}</p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
