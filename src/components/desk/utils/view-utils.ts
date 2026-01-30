export const makeDocView = (
  projectId: string,
  doc: { id: string; title?: string },
) => ({
  kind: "document" as const,
  id: doc.id,
  title: doc.title || "Untitled",
  params: { projectId },
});
export const makeDiscussionsView = (projectId: string) => ({
  kind: "discussions" as const,
  id: projectId, // stable per project
  title: "Discussions",
  params: { projectId },
});

export const makeThreadView = (
  projectId: string,
  thread: { id: string; topic?: string },
) => ({
  kind: "thread" as const,
  id: thread.id,
  title: thread.topic || "Thread",
  params: { projectId },
});
export const makeMeshMeetView = (projectId: string) => ({
  kind: "meshmeet" as const,
  id: projectId,
  title: "Mesh Meet",
  params: { projectId },
});
export const makeTaskboardView = (projectId: string) => ({
  kind: "taskboard" as const,
  id: projectId,
  title: "Task Board",
  params: { projectId },
});
