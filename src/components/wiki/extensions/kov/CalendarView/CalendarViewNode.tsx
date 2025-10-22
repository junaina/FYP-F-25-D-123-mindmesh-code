"use client";

import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import dynamic from "next/dynamic";

// Calendar is a **named** export in your file, so we pick it out with `.then(m => m.Calendar)`
// We also disable SSR to mirror your TableView dynamic import pattern.
const Calendar = dynamic(
  () => import("@/components/calendar/Calendar").then((m) => m.Calendar),
  { ssr: false }
);

type OwnProps = { projectId: string; docId: string };
type Props = OwnProps & NodeViewProps;

export default function CalendarViewNode(props: Props) {
  const { node, updateAttributes } = props;
  const { projectId, docId } = props;

  // attrs stored in the document JSON (we'll define the extension in Phase 4)
  const { collectionId, view, start } = node.attrs as {
    collectionId: string;
    view?: "month"; // reserved for future week/day
    start?: string; // ISO yyyy-mm-01T00:00:00.000Z
  };

  // Whenever the user navigates months, Calendar will call this,
  // and we persist it by updating node attrs. Autosave will do the actual PATCH.
  function handleAnchorChange(nextISO: string) {
    updateAttributes({ start: nextISO });
  }

  return (
    <NodeViewWrapper as="div" className="my-3">
      <div className="w-full">
        <Calendar
          projectId={projectId}
          docId={docId}
          collectionId={collectionId}
          initialAnchor={start}
          onAnchorChange={handleAnchorChange}
        />
      </div>
    </NodeViewWrapper>
  );
}
