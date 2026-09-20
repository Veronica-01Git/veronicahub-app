import { useEffect } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { type UniverseTab } from "./types";
import {
  Activity,
  CircleDollarSign,
  Gauge,
  Network,
  ShieldCheck,
  UserCheck,
  Users,
  Waypoints,
} from "lucide-react";

interface UniverseCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTab: (tab: UniverseTab) => void;
}

export function UniverseCommand({ open, onOpenChange, onSelectTab }: UniverseCommandProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const handleSelect = (tab: UniverseTab) => {
    onSelectTab(tab);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>UNIVERSE COMMAND</span>
        <span>ESC PARA FECHAR</span>
      </div>

      <CommandInput placeholder="Navegar pelo Universe…" />

      <CommandList>
        <CommandEmpty>Nenhum comando encontrado.</CommandEmpty>

        <CommandGroup heading="CORE">
          <CommandItem onSelect={() => handleSelect("00")}>
            <Activity className="mr-2 h-4 w-4 text-neon-green" />
            <span>Today</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("09")}>
            <CircleDollarSign className="mr-2 h-4 w-4 text-neon-green" />
            <span>Money</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("10")}>
            <Users className="mr-2 h-4 w-4 text-neon-green" />
            <span>Customers</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("11")}>
            <Waypoints className="mr-2 h-4 w-4 text-neon-cyan" />
            <span>Funnels</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="SYSTEM">
          <CommandItem onSelect={() => handleSelect("02")}>
            <Network className="mr-2 h-4 w-4 text-neon-cyan" />
            <span>Ecosystem</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("12")}>
            <Gauge className="mr-2 h-4 w-4 text-neon-cyan" />
            <span>System Health</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="GOVERNANCE">
          <CommandItem onSelect={() => handleSelect("03")}>
            <UserCheck className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Character Bible</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("08")}>
            <ShieldCheck className="mr-2 h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span>Decisions</span>
              <span className="font-mono-tech text-[9px] text-muted-foreground/70">
                estrutura sem persistência
              </span>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
