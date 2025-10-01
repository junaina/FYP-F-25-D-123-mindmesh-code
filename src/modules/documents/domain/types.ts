//list of property kinds

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
  "url",
  "status",
] as const;

// `PROPERTY_TYPES` is an array of string literals, so `PropertyType` is a union of those string literals
export type PropertyType = (typeof PROPERTY_TYPES)[number];

// PropertyOption represents an option for properties like select, multi_select, status, persons, files, urls, emails
export interface PropertyOption {
  id: string;
  value: string;
  color?: string | null;
  position?: number | null;
}
export interface PropertyDefinition {
  id: string;
  name: string;
  type: PropertyType;
  options?: PropertyOption[];
}

export type PropertyValue =
  | { type: "text"; value: string | null }
  | {
      type: "number";
      value:
        | number
        | null
        | { type: "select"; value: string | null } //option Id
        | { type: "multi_select"; value: string[] | null } //array of option Ids
        | { type: "date_time"; value: string | null } //ISO string
        | { type: "email"; value: string[] | null } //array of email strings
        | { type: "person"; value: string[] | null } //user Ids
        | { type: "file"; value: string[] | null } //array of file Ids
        | { type: "checkbox"; value: boolean | null }
        | { type: "url"; value: string[] | null } //multiple url strings
        | { type: "status"; value: string | null }; //option Id
    };

export interface DocPropertyRow {
  definition: PropertyDefinition;
  value: PropertyValue;
}
