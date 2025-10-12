// src/components/timeline/events/adapters.ts
export type PropertyDef = { id: string; name: string; kind: string };
export type OptionsByPropertyId = Record<
  string,
  { id: string; name: string }[]
>;

export function makePropertyDisplayMapper(
  defs: PropertyDef[],
  optionsByPropertyId: OptionsByPropertyId = {}
) {
  // quick lookup for property by name → (id, kind)
  const defByName = new Map(defs.map((d) => [d.name, d]));

  return function resolve(name: string, raw: unknown): string[] {
    const def = defByName.get(name);
    if (!def) return raw == null ? [] : [String(raw)];

    switch (def.kind) {
      case "text":
      case "number":
      case "email":
      case "url":
      case "date":
      case "date_time":
        return raw == null ? [] : [String(raw)];

      case "select": {
        const id = raw == null ? "" : String(raw);
        const opts = optionsByPropertyId[def.id] ?? [];
        const found = opts.find((o) => o.id === id);
        return found ? [found.name] : id ? [id] : [];
      }

      case "multi_select": {
        const ids: string[] = Array.isArray(raw)
          ? raw.map(String)
          : raw == null
          ? []
          : [String(raw)];
        if (!ids.length) return [];
        const opts = optionsByPropertyId[def.id] ?? [];
        const byId = new Map(opts.map((o) => [o.id, o.name]));
        const names = ids.map((i) => byId.get(i)).filter(Boolean) as string[];
        return names.length ? names : ids; // fallback to ids if not found
      }

      default:
        return raw == null ? [] : [String(raw)];
    }
  };
}

export type ServerEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  properties?: Array<{ id: string; name: string; type: string; value: string }>;
};

export function mapServerEventToDto(e: ServerEvent) {
  return {
    id: e.id,
    documentId: e.id, // TEMP until you expose docId; you can swap this to e.documentId later
    title: e.title || "Untitled",
    start: e.start,
    end: e.end,
    properties: e.properties ?? [],
  };
}
