// src/types/wiki.ts
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

export type PropertyOption = { id: string; value: string; color?: string };

export type UIPropertyDefinition = {
  id: string;
  name: string;
  type: PropertyType;       // must be one of the strings above, no spaces!
  options?: PropertyOption[]; // for select/multi/status
};

export type PropertyValue =
  | { type: "text"; value: string | null }
  | { type: "number"; value: number | null }
  | { type: "select"; value: string | null }
  | { type: "multi_select"; value: string[] }
  | { type: "date_time"; value: string | null } // ISO string
  | { type: "email"; value: string | null }
  | { type: "person"; value: string[] }         // user ids
  | { type: "file"; value: string[] }           // file ids/urls
  | { type: "checkbox"; value: boolean }
  | { type: "status"; value: string | null };

export type UIDocPropertyRow = {
  definition: UIPropertyDefinition;
  value: PropertyValue;
};
