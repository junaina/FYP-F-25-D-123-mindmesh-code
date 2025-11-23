"use client";

import { NodeViewWrapper } from "@tiptap/react";
import dynamic from "next/dynamic";

type BoardViewNodeProps = {
  projectId: string;
  docId: string;
  collectionId: string;
};

/**
 * We mount your existing KanbanBoard here.
 * For now it just receives IDs; we’ll wire its data
 * fetching/mutations to the backend in the next steps.
 */
const KanbanBoard = dynamic(() => import("@/components/kanban/KanbanBoard"), {
  ssr: false,
});

export default function BoardViewNode({
  projectId,
  docId,
  collectionId,
}: BoardViewNodeProps) {
  return (
    <NodeViewWrapper className="my-4">
      <KanbanBoard
        // we’ll extend this component’s props later
        projectId={projectId}
        docId={docId}
        collectionId={collectionId}
      />
    </NodeViewWrapper>
  );
}
