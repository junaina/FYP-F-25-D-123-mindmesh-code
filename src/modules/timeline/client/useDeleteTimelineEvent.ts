"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEvent } from "./timeline.api";
import { timelineKeys } from "./keys";

type View = "hour" | "day" | "week" | "month";

export function useDeleteTimelineEvent(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
}) {
  const qc = useQueryClient();
  const { projectId, docId, collectionId } = opts;

  return useMutation({
    mutationFn: (input: { documentId: string }) =>
      deleteEvent({ ...opts, documentId: input.documentId }),
    onSuccess: () => {
      // invalidate all cached windows/views of this collection’s events
      qc.invalidateQueries({
        // matches: ["timeline.events", projectId, docId, collectionId, ...]
        queryKey: [
          timelineKeys.events(projectId, docId, collectionId, "hour", "0")[0],
          projectId,
          docId,
          collectionId,
        ],
        exact: false,
      });
    },
  });
}
