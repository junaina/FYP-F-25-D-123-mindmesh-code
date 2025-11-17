export const makeDocView = (
  projectId: string,
  doc: { id: string; title?: string }
) => ({
  kind: "document" as const,
  id: doc.id,
  title: doc.title || "Untitled",
  params: { projectId },
});
