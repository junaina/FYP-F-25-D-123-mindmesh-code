"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Chip({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span title={title} className={cn("mm-chip mm-chip--gray", className)}>
      {children}
    </span>
  );
}

export function OptionChip({
  label,
  colorClass,
  title,
  className,
}: {
  label: string;
  colorClass?: string | null;
  title?: string;
  className?: string;
}) {
  return (
    <Chip
      title={title}
      className={cn(colorClass ?? "mm-chip--gray", className)}
    >
      {label}
    </Chip>
  );
}
