import { useEffect } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { type UniverseTab } from "./types";
import {
  Compass,
  Fingerprint,
  LayoutDashboard,
  Mic,
  Network,
  Palette,
  Shield,
  Terminal,
  Tv,
  UserCheck,
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
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2 font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">
        <span>UNIVERSE COMMAND</span>
        <span>ESC PARA FECHAR</span>
      </div>
      <CommandInput placeholder="Digite um comando do sistema…" />
      <CommandList>
        <CommandEmpty>Nenhum comando do sistema encontrado.</CommandEmpty>
        <CommandGroup heading="CANONICAL SYSTEM">
          <CommandItem onSelect={() => handleSelect("00")}><LayoutDashboard className="mr-2 h-4 w-4 text-neon-green" /><span>00 / Go to Overview</span></CommandItem>
          <CommandItem onSelect={() => handleSelect("01")}><Fingerprint className="mr-2 h-4 w-4 text-neon-green" /><span>01 / Go to Essence</span></CommandItem>
          <CommandItem onSelect={() => handleSelect("02")}><Network className="mr-2 h-4 w-4 text-neon-green" /><span>02 / Go to Ecosystem</span></CommandItem>
          <CommandItem onSelect={() => handleSelect("03")}><UserCheck className="mr-2 h-4 w-4 text-neon-green" /><span>03 / Go to Character</span></CommandItem>
          <CommandItem onSelect={() => handleSelect("04")}><Palette className="mr-2 h-4 w-4 text-neon-green" /><span>04 / Go to Visual System</span></CommandItem>
          <CommandItem onSelect={() => handleSelect("05")}><Mic className="mr-2 h-4 w-4 text-neon-green" /><span>05 / Go to Voice</span></CommandItem>
          <CommandItem onSelect={() => handleSelect("06")}><Tv className="mr-2 h-4 w-4 text-neon-green" /><span>06 / Go to Media</span></CommandItem>
          <CommandItem onSelect={() => handleSelect("07")}><Terminal className="mr-2 h-4 w-4 text-neon-green" /><span>07 / Go to Prompt Lab</span></CommandItem>
          <CommandItem onSelect={() => handleSelect("08")}><Compass className="mr-2 h-4 w-4 text-neon-green" /><span>08 / Go to Decisions</span></CommandItem>
          <CommandItem onSelect={() => handleSelect("09")}><Shield className="mr-2 h-4 w-4 text-neon-cyan" /><span>09 / Go to Guardian</span></CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
