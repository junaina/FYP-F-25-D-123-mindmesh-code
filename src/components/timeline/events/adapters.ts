export type PropertyDef = { id: string; name: string; kind: string };
export type OptionsByPropertyId = Record<
  string,
  { id: string; name: string }[]
>;
export type PropertyOptionsMap = OptionsByPropertyId;
export function makePropertyDisplayMapper(
  defs: PropertyDef[],
  optionsByPropertyId: OptionsByPropertyId = {}
) {
  // quick lookup for property by name → (id, kind)
  const defByName = new Map(defs.map((d) => [d.name, d]));
  // NEW: global option-id → label map (covers mis-associations)
  const globalOptionLabel = new Map<string, string>();
  for (const opts of Object.values(optionsByPropertyId)) {
    for (const o of opts ?? []) {
      // tolerate { name } or { value } from the server
      const label = (o as any).name ?? (o as any).value ?? (o as any).label;
      if (label) globalOptionLabel.set(o.id, label);
    }
  }
  return function resolve(name: string, raw: unknown): string[] {
    const def = defByName.get(name);
    if (!def) return raw == null ? [] : [String(raw)];
    console.log("[adapter.resolve]", {
      name,
      kind: def?.kind,
      defId: def?.id,
      raw,
      isArray: Array.isArray(raw),
      opts: def ? optionsByPropertyId[def.id]?.length ?? 0 : 0,
    });

    switch (def.kind) {
      case "text":
      case "number":
      case "email":
      case "url":
      case "date":
      case "date_time":
        return raw == null ? [] : [String(raw)];
      case "status":
      case "select": {
        const id = raw == null ? "" : String(raw);
        const local = (optionsByPropertyId[def.id] ?? []).find(
          (o) => o.id === id
        );
        const label =
          (local as any)?.name ??
          (local as any)?.value ??
          globalOptionLabel.get(id);

        return label ? [label] : id ? [id] : [];
      }

      case "multi_select": {
        const ids = Array.isArray(raw) ? raw.map(String) : [];
        const localById = new Map(
          (optionsByPropertyId[def.id] ?? []).map((o) => [
            o.id,
            (o as any).name ?? (o as any).value ?? (o as any).label,
          ])
        );

        const names = ids.map(
          (id) => localById.get(id) ?? globalOptionLabel.get(id) ?? id
        );
        // DEBUG: if we had to fall back, log it once.
        if (names.some((n, i) => n === ids[i])) {
          console.warn(
            "[timeline.adapter] option IDs not found in local list",
            {
              propId: def.id,
              ids,
              localOptionIds: Array.from(localById.keys()),
            }
          );
        }
        return names;
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
