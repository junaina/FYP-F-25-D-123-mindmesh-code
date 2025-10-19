"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

export type ProjectLite = {
  id: string;
  name: string;
  visibility: "PRIVATE" | "LINK" | "ORG";
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projects: ProjectLite[];
  //if  were to wire a backend search later i'd pass a function here but i dont need it for the mvp now so...:\
};

export default function ProjectSearchModal({
  open,
  onOpenChange,
  projects,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  //client side shortlist
  const localMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  const items = localMatches;
  function go(p: ProjectLite) {
    onOpenChange(false);
    router.push(`/projects/${p.id}`);
  }
  //shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() == "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 overflow-hidden border-none bg-popover",
          "w-[75vw] h-[75vh] max-w-[960px] max-h-[800px]" // 75% screen from center
        )}
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search projects…"
          />
          <CommandList>
            {loading && (
              <div className="py-3 text-center text-sm text-muted-foreground">
                Searching…
              </div>
            )}
            <CommandEmpty>No projects found.</CommandEmpty>
            <CommandGroup heading="Projects">
              {items.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={() => go(p)}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="truncate">{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
