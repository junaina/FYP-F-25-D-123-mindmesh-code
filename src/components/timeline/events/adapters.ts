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
