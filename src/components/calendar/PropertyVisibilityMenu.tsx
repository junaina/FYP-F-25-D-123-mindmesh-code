"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  EyeOff,
  ChevronRight,
  Plus,
  // icons for kinds:
  Hash,
  Tag,
  ListFilter,
  ListChecks,
  Calendar,
  Mail,
  User2,
  CheckSquare2,
  Paperclip,
} from "lucide-react";
import type { PropKind } from "@/types/calendar";
import { cn } from "@/lib/utils";

type PropRow = { name: string; kind: PropKind };

export function PropertyVisibilityMenu({
  properties,
  visible,
  onToggle,
  onOpenDetails,
  onNewProperty,
  className,
}: {
  properties: PropRow[];
  visible: Set<string>;
  onToggle: (name: string, next: boolean) => void;
  onOpenDetails?: (name: string) => void;
  onNewProperty?: () => void;
  className?: string;
}) {
  // Neutral highlight using theme tokens
  const itemCls =
    "px-2 py-2 data-[highlighted]:bg-muted data-[highlighted]:text-foreground " +
    "focus:bg-muted focus:text-foreground data-[highlighted]:outline-none";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          Properties
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Properties</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-[360px] overflow-auto py-1">
          {properties.length === 0 && (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              No properties found.
            </div>
          )}

          {properties.map((p) => {
            const isVisible = visible.has(p.name);
            const KindIcon = iconForKind(p.kind);

            return (
              <DropdownMenuItem
                key={p.name}
                onSelect={(e) => e.preventDefault()} // keep menu open
                className={itemCls}
              >
                <div className="flex w-full items-center gap-2">
                  <button
                    type="button"
                    aria-label={isVisible ? "Hide" : "Show"}
                    aria-pressed={isVisible}
                    onClick={() => onToggle(p.name, !isVisible)}
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
                    )}
                  >
                    {isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4 opacity-70" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{p.name}</div>
                    <div className="mt-1">
                      <span className="mm-chip mm-chip--gray text-[10px]">
                        <KindIcon className="h-3 w-3 shrink-0" aria-hidden />
                        <span className="truncate">{labelForKind(p.kind)}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Open property"
                    onClick={() => onOpenDetails?.(p.name)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onNewProperty?.();
          }}
          className={itemCls}
        >
          <div className="flex w-full items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New property</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function labelForKind(kind: PropKind) {
  switch (kind) {
    case "number":
      return "Number";
    case "text":
      return "Text";
    case "select":
      return "Select";
    case "multi_select":
      return "Multi-select";
    case "date_time":
      return "Date & time";
    case "email":
      return "Email";
    case "person":
      return "Person";
    case "checkbox":
      return "Checkbox";
    case "file":
      return "File";
    default:
      return kind;
  }
}

function iconForKind(kind: PropKind) {
  switch (kind) {
    case "number":
      return Hash;
    case "text":
      return Tag;
    case "select":
      return ListFilter;
    case "multi_select":
      return ListChecks;
    case "date_time":
      return Calendar;
    case "email":
      return Mail;
    case "person":
      return User2;
    case "checkbox":
      return CheckSquare2;
    case "file":
      return Paperclip;
    default:
      return Tag;
  }
}
