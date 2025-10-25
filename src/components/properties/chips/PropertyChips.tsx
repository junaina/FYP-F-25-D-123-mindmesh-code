"use client";
import * as React from "react";
import type { PropertyValueDto } from "@/modules/documents/dto/doc.dto";
import { OptionChip } from "./Chip";

export type PropertyMeta = {
  id: string;
  name: string;
  kind: "select" | "multi_select" | "status" | string;
  options?: { id: string; value: string; color?: string | null }[];
};

export function PropertyChipsById({
  value,
  propertyId,
  metaById,
  titlePrefix,
}: {
  value: PropertyValueDto | null | undefined;
  propertyId: string;
  metaById: Map<string, PropertyMeta>;
  titlePrefix: string;
}) {
  const meta = metaById.get(propertyId);
  if (!value || !meta) return null;
  const title = (s: string) => (titlePrefix ? `${titlePrefix}: ${s}` : s);
  if (value.type === "multi_select") {
    const ids = Array.isArray(value.value) ? (value.value as string[]) : [];
    const opts = (meta.options ?? []).filter((o) => ids.includes(o.id));
    if (opts.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {opts.map((o) => (
          <OptionChip
            key={o.id}
            label={o.value}
            colorClass={o.color ?? null}
            title={title(o.value)}
          />
        ))}
      </div>
    );
  }
  if (value.type === "select" || value.type === "status") {
    const id = (value.value as string | null) ?? null;
    const o = (meta.options ?? []).find((x) => x.id === id);
    if (!o) return null;
    return (
      <OptionChip
        label={o.value}
        colorClass={o.color ?? null}
        title={title(o.value)}
      />
    );
  }

  return null;
}

export function PropertyChipsByName({
  propertyName,
  metaByName,
  raw,
  titlePrefix,
}: {
  propertyName: string;
  metaByName: Map<string, PropertyMeta>;
  raw: unknown;
  titlePrefix?: string;
}) {
  const meta = metaByName.get(propertyName);
  if (!meta) return null;
  const title = (s: string) => (titlePrefix ? `${titlePrefix}: ${s}` : s);

  if (meta.kind === "multi_select") {
    const ids = Array.isArray(raw)
      ? raw.map(String)
      : typeof raw === "object" &&
        raw &&
        "type" in (raw as any) &&
        Array.isArray((raw as any).value)
      ? ((raw as any).value as string[]).map(String)
      : [];
    const opts = (meta.options ?? []).filter((o) => ids.includes(o.id));
    if (!opts.length) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {opts.map((o) => (
          <OptionChip
            key={o.id}
            label={o.value}
            colorClass={o.color ?? null}
            title={title(o.value)}
          />
        ))}
      </div>
    );
  }

  const id =
    typeof raw === "string"
      ? raw
      : typeof raw === "object" && raw && "type" in (raw as any)
      ? String((raw as any).value ?? "")
      : "";

  const o = (meta.options ?? []).find((x) => x.id === id);
  if (!o) return null;
  return (
    <OptionChip
      label={o.value}
      colorClass={o.color ?? null}
      title={title(o.value)}
    />
  );
}
