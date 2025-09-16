// Server-side (domain) types used by service/mappers

export type PropertyType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "date"
  | "email"
  | "person"
  | "file"
  | "checkbox"
  | "status";

// Prisma stores "date" (timestamp). UI uses "date_time".
export const dbToUi: Record<PropertyType | string, string> = {
  text: "text",
  number: "number",
  select: "select",
  multi_select: "multi_select",
  date: "date_time",
  email: "email",
  person: "person",
  file: "file",
  checkbox: "checkbox",
  status: "status",
};

export type ApiPropOption = {
  id: string;
  value: string;
  color?: string | null;
};

export type ApiProp = {
  type: PropertyType | string;
  value: unknown;
  options?: ApiPropOption[];
};
