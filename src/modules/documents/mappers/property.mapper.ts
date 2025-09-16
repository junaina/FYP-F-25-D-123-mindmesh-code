import type {
  ApiProp,
  ApiPropOption,
  PropertyType,
} from "@/modules/documents/domain/types";
import { dbToUi } from "@/modules/documents/domain/types";
import type {
  PropertyDefinition,
  PropertyOption,
  DocumentPropertyValue,
  Prisma,
} from "@/generated/prisma";

// Build API properties map from defs + values
export function buildApiProps(
  links: Array<{
    property: PropertyDefinition & { options: PropertyOption[] };
  }>,
  values: Array<DocumentPropertyValue & { option: PropertyOption | null }>
): Record<string, ApiProp> {
  const byPropId = new Map(values.map((v) => [v.propertyId, v]));
  const out: Record<string, ApiProp> = {};

  for (const l of links) {
    const def = l.property;
    const uiType = dbToUi[def.type] ?? "text";
    const v = byPropId.get(def.id);

    const value =
      def.type === "text" || def.type === "email"
        ? v?.valueString ?? null
        : def.type === "number"
        ? v?.valueNumber ?? null
        : def.type === "checkbox"
        ? v?.valueBool ?? false
        : def.type === "date"
        ? v?.valueDate
          ? new Date(v.valueDate).toISOString()
          : null
        : def.type === "select" || def.type === "status"
        ? v?.option?.id ?? null
        : // multi_select/person/file -> JSON
          (v?.valueJson as Prisma.InputJsonValue | null) ?? [];

    const options: ApiPropOption[] | undefined =
      def.type === "select" || def.type === "status"
        ? def.options.map((o) => ({
            id: o.id,
            value: o.value,
            color: o.color ?? null,
          }))
        : undefined;

    out[def.name] = { type: uiType, value, options };
  }

  return out;
}

// Convert (def.type, value) to columns for DocumentPropertyValue
export function primitiveToDb(
  defType: PropertyType | string,
  value: unknown
): Partial<{
  valueString: string | null;
  valueNumber: number | null;
  valueBool: boolean | null;
  valueDate: Date | null;
  valueJson: Prisma.InputJsonValue | null;
  optionId: string | null;
}> {
  switch (defType) {
    case "text":
    case "email":
      return { valueString: value == null ? null : String(value) };
    case "number":
      return { valueNumber: value == null ? null : Number(value) };
    case "checkbox":
      return { valueBool: Boolean(value) };
    case "date":
      return { valueDate: value ? new Date(String(value)) : null };
    case "select":
    case "status":
      return {
        optionId: typeof value === "string" && value.length ? value : null,
        valueString: null,
        valueNumber: null,
        valueBool: null,
        valueDate: null,
        valueJson: null,
      };
    case "multi_select":
    case "person":
    case "file":
      return {
        valueJson: (Array.isArray(value) ? value : []) as Prisma.InputJsonValue,
      };
    default:
      return { valueString: value == null ? null : String(value) };
  }
}
