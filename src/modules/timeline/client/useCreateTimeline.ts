"use client";

import { useMutation } from "@tanstack/react-query";
import { createTimelineEvent } from "./timeline.api";

type Ctx = { projectId: string; docId: string; collectionId: string };

export function useCreateTimelineEvent(ctx: Ctx) {
  return useMutation({
    mutationFn: (input: { title?: string; start: string; end: string }) =>
      createTimelineEvent(ctx.projectId, ctx.docId, ctx.collectionId, input),
  });
}
