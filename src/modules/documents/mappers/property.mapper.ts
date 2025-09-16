// src/modules/documents/mappers/property.mapper.ts
import type { Prisma } from "@/generated/prisma";
import type {
  PropertyType,
  PropertyOption,
} from "@/modules/documents/domain/types";
export type ApiProp = {
  id: string;
  name: string;
  type: PropertyType;
  options?: PropertyOption[];
};
export type PrimitiveInput =
  | { type: "text"; value: string | null }
  | { type: "number"; value: number | null }
  | { type: "email"; value: string | null }
  | { type: "checkbox"; value: boolean }
  | { type: "date_time"; value: string | null } // ISO string
  | { type: "select"; value: string | null } // option id
  | { type: "status"; value: string | null } // option id
  | { type: "multi_select"; value: string[] } // option ids
  | { type: "person"; value: string[] }
  | { type: "file"; value: string[] };
export function buildApiProps(
  defs: Array<{
    id: string;
    name: string;
    type: string;
    options?: PropertyOption[];
  }>
): ApiProp[] {
  return defs.map((d) => ({
    id: d.id,
    name: d.name,
    // Coerce Prisma string-> PropertyType; UI narrows later
    type: d.type as PropertyType,
    options: d.options ?? [],
  }));
}
// IMPORTANT: this matches DocumentRepo.upsertValue’s 'data' parameter
export function primitiveToDb(p: PrimitiveInput): {
  valueString?: string | null;
  valueNumber?: number | null;
  valueBool?: boolean | null;
  valueDate?: Date | null;
  valueJson?: Prisma.InputJsonValue; // no null
  optionId?: string | null;
} {
  switch (p.type) {
    case "text":
    case "email":
      return { valueString: p.value ?? null };

    case "number":
      return { valueNumber: p.value ?? null };

    case "checkbox":
      return { valueBool: p.value ?? null };

    case "date_time":
      return { valueDate: p.value ? new Date(p.value) : null };

    case "select":
    case "status":
      return { optionId: p.value ?? null };

    case "multi_select":
    case "person":
    case "file":
      // Prisma JSON must be InputJsonValue (array is OK). If you want to clear, omit the key.
      return p.value ? { valueJson: p.value as Prisma.InputJsonValue } : {};
  }
}
