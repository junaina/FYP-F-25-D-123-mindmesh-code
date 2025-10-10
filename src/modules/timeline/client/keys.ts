export const timelineKeys = {
  events: (
    projectId: string,
    docId: string,
    collectionId: string,
    view: "hour" | "day" | "week" | "month",
    startISO: string
  ) =>
    [
      "timeline.events",
      projectId,
      docId,
      collectionId,
      view,
      startISO,
    ] as const,
};
