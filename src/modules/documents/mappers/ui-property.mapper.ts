import type {
  UIDocPropertyRow,
  UIPropertyDefinition,
  PropertyValue,
  PropertyType as UIType,
} from "@/types/wiki";

export type ApiPropOption = {
  id: string;
  value: string;
  color?: string | null;
};
export type ApiProp = {
  type: string | UIType;
  value: unknown;
  options?: ApiPropOption[];
};

// DB says "date", UI says "date_time"
const dbToUi: Record<string, UIType> = {
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

export function apiPropsToUiRows(
  apiProps: Record<string, ApiProp>
): UIDocPropertyRow[] {
  return Object.entries(apiProps).map(([name, p]) => {
    const type = dbToUi[p.type] ?? ("text" as UIType);
    return {
      definition: {
        id: name, // temporary UI id (unique per document for now)
        name,
        type,
        options: p.options ?? [],
      } as UIPropertyDefinition,
      value: primitiveToUi(type, p.value),
    };
  });
}

export function uiRowsToPatchObject(rows: UIDocPropertyRow[]) {
  const out: Record<string, unknown> = {};
  for (const { definition, value } of rows)
    out[definition.name] = uiToPrimitive(value);
  return out;
}

function primitiveToUi(type: UIType, value: unknown): PropertyValue {
  switch (type) {
    case "text":
      return { type, value: typeof value === "string" ? value : null };
    case "number":
      return {
        type,
        value:
          value == null
            ? null
            : typeof value === "number"
            ? value
            : Number(value),
      };
    case "select":
    case "status":
    case "email":
      return { type, value: (value as string | null) ?? null };
    case "multi_select":
    case "person":
    case "file":
      return { type, value: Array.isArray(value) ? (value as string[]) : [] };
    case "date_time":
      return { type, value: (value as string | null) ?? null };
    case "checkbox":
      return { type, value: Boolean(value) };
  }
}

function uiToPrimitive(v: PropertyValue): unknown {
  switch (v.type) {
    case "text":
    case "select":
    case "email":
    case "status":
      return v.value ?? null;
    case "number":
      return v.value == null ? null : Number(v.value);
    case "date_time":
      return v.value ?? null; // keep ISO string
    case "checkbox":
      return !!v.value;
    case "multi_select":
    case "person":
    case "file":
      return Array.isArray(v.value) ? v.value : [];
  }
}
