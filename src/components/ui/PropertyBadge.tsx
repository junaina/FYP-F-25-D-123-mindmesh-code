"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CheckSquare2,
  Calendar,
  Hash,
  Mail,
  Paperclip,
  User2,
  Tag,
  ListFilter,
  ListChecks,
  Link as LinkIcon,
} from "lucide-react";
import type { PropColor, PropKind } from "@/types/calendar";

function colorClass(color?: PropColor) {
  return color ? `mm-chip--${color}` : "mm-chip--gray";
}
function iconFor(kind: PropKind) {
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

export function PropertyBadge({
  kind,
  color,
  children,
  className,
  as = "span",
  href,
}: {
  kind: PropKind;
  color?: PropColor;
  children: React.ReactNode;
  className?: string;
  as?: "span" | "a";
  href?: string;
}) {
  const Icon = iconFor(kind);
  const Comp: React.ElementType = as;

  return (
    <Comp href={href} className={cn("mm-chip", colorClass(color), className)}>
      <Icon className="size-[12px] shrink-0" aria-hidden />
      <span className="truncate">{children}</span>
      {as === "a" && (
        <LinkIcon className="size-[12px] opacity-70" aria-hidden />
      )}
    </Comp>
  );
}
