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
  LayoutDashboard,
  Network,
  UserCheck,
  Palette,
  Mic,
  Tv,
  Terminal,
  Compass,
  Sparkles,
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
      <div className="border-b border-border/40 px-3 py-2 font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase flex items-center justify-between">
        <span>UNIVERSE COMMAND</span>
        <span>ESC PARA FECHAR</span>
      </div>

      <CommandInput placeholder="Digite um comando do sistema…" />

      <CommandList>
        <CommandEmpty>Nenhum comando do sistema encontrado.</CommandEmpty>

        <CommandGroup heading="SISTEMA DISPONÍVEL">
          <CommandItem onSelect={() => handleSelect("00")}>
            <LayoutDashboard className="mr-2 h-4 w-4 text-neon-green" />
            <span>00 / Go to Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("02")}>
            <Network className="mr-2 h-4 w-4 text-neon-green" />
            <span>02 / Go to Ecosystem</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("03")}>
            <UserCheck className="mr-2 h-4 w-4 text-neon-green" />
            <span>03 / Go to Character Bible</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="MÓDULOS EM DESENVOLVIMENTO (PHASE 2+)">
          <CommandItem onSelect={() => handleSelect("01")}>
            <Compass className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">01 / Go to Essence</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("04")}>
            <Palette className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">04 / Go to Visual System</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("05")}>
            <Mic className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">05 / Go to Voice</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("06")}>
            <Tv className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">06 / Go to Media</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("07")}>
            <Terminal className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">07 / Go to Prompt Lab</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("08")}>
            <Compass className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">08 / Go to Decisions</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="INTELLIGENCE">
          <CommandItem disabled className="opacity-50 cursor-not-allowed">
            <Sparkles className="mr-2 h-4 w-4 text-neon-cyan/50" />
            <div className="flex flex-col">
              <span className="font-medium text-muted-foreground">ASK VERONICA UNIVERSE</span>
              <span className="text-[10px] text-muted-foreground/60 font-mono-tech">
                Coming later (Phase 3)
              </span>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
