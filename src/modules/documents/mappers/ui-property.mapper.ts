import type {
  DocPropertyRow,
  PropertyDefinition,
  PropertyOption,
} from "@/modules/documents/domain/types";

export type MiniSelectOption = {
  id: string;
  label: string;
  value: string; // REQUIRED by MiniSelect / MiniMultiSelect
  color?: string | null;
};

export function toMiniOptions(opts: PropertyOption[] = []): MiniSelectOption[] {
  return opts.map((o) => ({
    id: o.id,
    label: o.value,
    value: o.value,
    color: o.color ?? null,
  }));
}

export function toUIRow(row: DocPropertyRow) {
  return {
    definition: {
      id: row.definition.id,
      name: row.definition.name,
      type: row.definition.type,
      options: toMiniOptions(row.definition.options),
    },
    value: row.value,
  };
}
