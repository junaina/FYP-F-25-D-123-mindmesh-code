"use client";

import AskMindyClient from "@/components/ask-mindy/ask-mindy-client";
import type { RagCitation } from "@/components/ask-mindy/types";
import { makeDocView } from "../utils/view-utils";

type Props = {
  id: string;
  params: { projectId: string };
  className?: string;
};

export default function AskMindyView({ params, className }: Props) {
  const projectId = params?.projectId;

  if (!projectId) {
    return (
      <div className="p-4 text-sm text-red-500">
        Missing <code>projectId</code> for AskMindyView.
      </div>
    );
  }

  function openInDesk(payload: any) {
    const open =
      ((globalThis as any).openDeskDirect as ((p: any) => void) | undefined) ??
      ((globalThis as any).openDeskTab as ((p: any) => void) | undefined);

    open?.(payload);
  }

  function handleOpenSource(c: RagCitation) {
    if (c.sourceType === "DOCUMENT") {
      openInDesk(
        makeDocView(projectId, {
          id: c.sourceId,
          title: c.sourceTitle ?? "Document",
        }),
      );
    }
  }

  return (
    <div className={"h-full min-h-0 " + (className ?? "")}>
      <AskMindyClient
        projectId={projectId}
        embedded
        onOpenSource={handleOpenSource}
      />
    </div>
  );
}
