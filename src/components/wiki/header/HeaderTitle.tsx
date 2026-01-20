"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PencilLine } from "lucide-react";
import { patchDocHeader } from "@/modules/documents/client/docs.api";
// (Optional) shadcn tooltip:
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = { projectId: string; docId: string; title?: string };

export default function HeaderTitle({ projectId, docId, title }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(title ?? "Untitled");
  const [editing, setEditing] = useState(false);

  async function save(newTitle: string) {
    const safeTitle = newTitle.trim().length > 0 ? newTitle.trim() : "Untitled";
    setValue(safeTitle);
    try {
      await patchDocHeader(projectId, docId, { title: safeTitle });
      router.refresh();
    } catch (e) {
      console.error("Failed to save title:", e);
    }
  }

  return (
    <header className="group relative flex items-end gap-2 pb-1 min-w-0">
      {editing ? (
        <input
          className="flex w-full max-w-[65ch] bg-transparent border-none text-4xl font-bold tracking-tight outline-none
             leading-[1.25] py-1.5 px-0 resize-none overflow-hidden min-w-0
                     break-words mm-anywhere focus:outline-none focus:ring-0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            setEditing(false);
            void save(value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setEditing(false);
            } // cancel edits
          }}
          autoFocus
        />
      ) : (
        <>
          {/* Reserve space for the pencil to avoid layout shift (pr-10) */}
          <h1
            className="relative pr-4 text-4xl font-bold tracking-tight leading-[1.25] cursor-text break-words mm-anywhere min-w-0
                       after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0
                       after:bg-border after:transition-[width] after:duration-150
                       group-hover:after:w-full"
            onClick={() => setEditing(true)}
          >
            {value}
          </h1>

          {/* Pencil button (appears on hover/focus) */}
          <button
            type="button"
            aria-label="Edit title"
            onClick={() => setEditing(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 transition-opacity
                       text-muted-foreground hover:text-foreground
                       group-hover:opacity-100 focus:opacity-100 focus:outline-none"
          >
            <PencilLine className="size-4" />
          </button>

          
        </>
      )}
    </header>
  );
}
