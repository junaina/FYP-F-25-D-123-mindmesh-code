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
}: {
  properties?: Record<string, Property>;
  visible: Set<string>;
  className?: string;
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
          case "email": {
            const href = v.value ? `mailto:${v.value}` : undefined;
            return (
              <PropertyBadge
                key={p.id}
                as={href ? "a" : "span"}
                href={href}
                kind="email"
                color={p.color}
              >
                {v.value || "—"}
              </PropertyBadge>
            );
          }
          case "person":
            return (
              <PropertyBadge key={p.id} kind="person" color={p.color}>
                {v.value?.name ?? "Unassigned"}
              </PropertyBadge>
            );
          case "checkbox":
            return (
              <PropertyBadge key={p.id} kind="checkbox" color={p.color}>
                {v.value ? "Done" : "Pending"}
              </PropertyBadge>
            );
          case "file":
            return (
              <PropertyBadge key={p.id} kind="file" color={p.color}>
                {v.value.length} file{v.value.length === 1 ? "" : "s"}
              </PropertyBadge>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
