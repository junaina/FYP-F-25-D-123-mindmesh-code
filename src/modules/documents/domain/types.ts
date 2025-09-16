// src/modules/documents/domain/types.ts
export const PROPERTY_TYPES = [
  "text",
  "number",
  "select",
  "multi_select",
  "date_time",
  "email",
  "person",
  "file",
  "checkbox",
  "status",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export interface PropertyOption {
  id: string;
  value: string;
  color?: string | null;
  position?: number | null; // optional; see migration suggestion below
}

export interface PropertyDefinition {
  id: string;
  name: string;
  type: PropertyType;
  options: PropertyOption[]; // empty for types that don't use options
}

export type PropertyValue =
  | { type: "text"; value: string | null }
  | { type: "number"; value: number | null }
  | { type: "email"; value: string | null }
  | { type: "checkbox"; value: boolean }
  | { type: "date_time"; value: string | null } // ISO string
  | { type: "select"; value: string | null } // optionId
  | { type: "status"; value: string | null } // optionId
  | { type: "multi_select"; value: string[] } // optionIds
  | { type: "person"; value: string[] } // userIds
  | { type: "file"; value: string[] }; // fileIds

export interface DocPropertyRow {
  definition: PropertyDefinition;
  value: PropertyValue;
}
