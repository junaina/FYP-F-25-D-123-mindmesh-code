"use client";
import * as React from "react";
import { PropertyBadge } from "./PropertyBadge";
import type { Property, PropertyValue, SelectOption } from "@/types/calendar";
import { cn } from "@/lib/utils";

function timeLabel(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function optionLabel(o?: SelectOption | null) {
  return o?.label ?? "—";
}

export function ItemProperties({
  properties,
  visible,
  className,
  onToggleCheckbox,
}: {
  properties?: Record<string, Property>;
  visible: Set<string>;
  className?: string;
  onToggleCheckbox?: (propName: string, next: boolean) => void;
}) {
  if (!properties) return null;

  const list = Object.values(properties).filter((p) => visible.has(p.name));
  if (list.length === 0) return null;

  return (
    <div className={cn("mt-1 flex flex-wrap gap-1 pb-1", className)}>
      {list.map((p) => {
        const v: PropertyValue = p.value;
        switch (v.kind) {
          case "text":
            return (
              <PropertyBadge key={p.id} kind="text" color={v.color ?? p.color}>
                {v.value}
              </PropertyBadge>
            );

          case "number":
            return (
              <PropertyBadge key={p.id} kind="number" color={p.color}>
                {v.value}
              </PropertyBadge>
            );

          case "select":
            return (
              <PropertyBadge
                key={p.id}
                kind="select"
                color={v.value?.color ?? p.color}
              >
                {optionLabel(v.value)}
              </PropertyBadge>
            );

          case "multi_select":
            return (
              <React.Fragment key={p.id}>
                {v.value.map((opt, i) => (
                  <PropertyBadge
                    key={`${p.id}-${i}`}
                    kind="multi_select"
                    color={opt.color ?? p.color}
                  >
                    {opt.label}
                  </PropertyBadge>
                ))}
              </React.Fragment>
            );

          case "date_time":
            return (
              <PropertyBadge key={p.id} kind="date_time" color={p.color}>
                {timeLabel(v.value.start)}
              </PropertyBadge>
            );

          /* ===== Special renderings per your request ===== */

          // Email: regular underlined link (no pill)
          case "email": {
            const mailto = v.value ? `mailto:${v.value}` : undefined;
            const stop = (e: React.SyntheticEvent) => {
              e.stopPropagation();
            };
            return (
              <a
                key={p.id}
                href={mailto}
                onClick={stop}
                onPointerDown={stop}
                className="underline text-primary text-[11px] leading-5"
              >
                {v.value || "—"}
              </a>
            );
          }
          case "checkbox": {
            const stop = (e: React.SyntheticEvent) => {
              e.stopPropagation();
              // don't preventDefault so the input can change
            };
            return (
              <label
                key={p.id}
                onClick={stop}
                onPointerDown={stop}
                className="inline-flex items-center gap-1.5 text-[11px] leading-5 text-foreground/90 select-none"
                title={p.name}
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-primary"
                  checked={!!v.value}
                  onChange={(e) => onToggleCheckbox?.(p.name, e.target.checked)}
                  aria-label={p.name}
                />
                <span>{p.name}</span>
              </label>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
