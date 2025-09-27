"use client";
import React from "react";
import {
  PropertyDefinitionDto,
  PropertyValueDto,
} from "@/modules/documents/dto/doc.dto";
import { format, isValid, isEqual, startOfDay } from "date-fns";
// Example: you might already have Chip/Badge components
import { Badge } from "@/components/ui/badge";

type Props = {
  def: PropertyDefinitionDto;
  value: PropertyValueDto | null | undefined;
};
function prettyDateTime(iso: string | null | undefined): string {
  if (!iso) return "Empty";
  const d = new Date(iso);
  if (!isValid(d)) return "Empty";

  // If time is midnight, show date only
  const showDateOnly = isEqual(startOfDay(d), d);
  return showDateOnly
    ? format(d, "EEEE, MMMM d, yyyy") // e.g., Tuesday, September 9, 2025
    : format(d, "EEEE, MMMM d, yyyy h:mm a"); // e.g., Tuesday, September 9, 2025 7:00 PM
}
export default function PropertyValueRenderer({ def, value }: Props) {
  if (!value) return <span className="text-muted-foreground">Empty</span>;

  switch (value.type) {
    case "text":
    case "number":
      return <span>{value.value ?? "Empty"}</span>;

    case "date_time":
      return <span>{prettyDateTime(value.value as string | null)}</span>;
    case "email":
      return value.value ? (
        <a href={`mailto:${value.value}`} className="underline text-blue-400">
          {value.value}
        </a>
      ) : (
        <span className="text-muted-foreground">Empty</span>
      );

    case "url":
      return value.value ? (
        <a
          href={value.value}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-400"
        >
          {value.value}
        </a>
      ) : (
        <span className="text-muted-foreground">Empty</span>
      );

    case "checkbox":
      return <span>{value.value ? "✅" : "⬜"}</span>;

    case "select":
    case "status": {
      const opt = def.options.find((o) => o.id === value.value);
      return opt ? (
        <Badge style={{ backgroundColor: opt.color ?? undefined }}>
          {opt.value}
        </Badge>
      ) : (
        <span className="text-muted-foreground">Empty</span>
      );
    }

    case "multi_select": {
      return (
        <div className="flex gap-1 flex-wrap">
          {value.value.length > 0 ? (
            value.value.map((id) => {
              const opt = def.options.find((o) => o.id === id);
              return (
                opt && (
                  <Badge
                    key={id}
                    style={{ backgroundColor: opt.color ?? undefined }}
                  >
                    {opt.value}
                  </Badge>
                )
              );
            })
          ) : (
            <span className="text-muted-foreground">Empty</span>
          )}
        </div>
      );
    }

    case "person":
    case "file":
      // For now just render raw IDs until you hook them up to user/file resolvers
      return value.value.length > 0 ? (
        <span>{value.value.join(", ")}</span>
      ) : (
        <span className="text-muted-foreground">Empty</span>
      );

    default:
      return <span className="text-muted-foreground">Empty</span>;
  }
}
