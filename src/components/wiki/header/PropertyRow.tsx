"use client";
import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { DefaultTypeIcon } from "@/modules/documents/domain/propery-icons";
import type { PropertyTypeDto as PropertyType } from "@/modules/documents/dto/doc.dto";
type Value = string | string[] | number | boolean | null | undefined;
type Props = {
  name: string;
  value?: Value;
  type: PropertyType;
  iconOverride?: LucideIcon; // for icon customization per property- will add customization later
};

export default function PropertyRow({
  name,
  type,
  value,
  iconOverride,
}: Props) {
  const display = Array.isArray(value) ? value.join(", ") : value ?? "";
  const Icon = iconOverride ?? DefaultTypeIcon[type];
  return (
    <div className="flex items-center gap-3 py-1">
      {/* Icon + muted name */}
      <div className="flex items-center gap-2 min-w-[180px]">
        <Icon className="h-4 w-4 text-muted-foreground stroke-40 " />
        <span className="text-sm text-muted-foreground">{name}</span>
      </div>

      {/* Current value(s) */}
      <span className="text-sm">
        {display ? display : <span className="text-foreground">Empty</span>}
      </span>
    </div>
  );
}
