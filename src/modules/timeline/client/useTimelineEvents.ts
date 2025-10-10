"use client";
import { useQuery } from "@tanstack/react-query";
import { listEvents } from "./timeline.api";
import { timelineKeys } from "./keys";

export function useTimelineEvents(
  projectId: string,
  docId: string,
  collectionId: string,
  view: "hour" | "day" | "week" | "month",
  startISO: string
) {
  return useQuery({
    queryKey: timelineKeys.events(
      projectId,
      docId,
      collectionId,
      view,
      startISO
    ),
    queryFn: () =>
      listEvents({ projectId, docId, collectionId, query: { view, startISO } }),
  });
}
