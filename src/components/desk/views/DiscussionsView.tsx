"use client";

import { useState } from "react";
import DiscussionsClient from "@/app/(app)/projects/[projectId]/discussions/DiscussionsClient";
import ThreadClient from "@/app/(app)/projects/[projectId]/discussions/threads/[threadId]/ThreadClient";
type Props = {
  id: string; // stable (usually projectId)
  params: { projectId: string };
  className?: string;
};

export default function DiscussionsView({ params, className }: Props) {
  const projectId = params?.projectId;

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  if (!projectId) {
    return (
      <div className="p-4 text-sm text-red-500">
        Missing <code>projectId</code> for DiscussionsView.
      </div>
    );
  }

  return (
    <div className={"h-full min-h-0 " + (className ?? "")}>
      {/* List pane (shown when no thread selected) */}
      <div
        className={selectedThreadId ? "hidden" : "h-full min-h-0 overflow-auto"}
      >
        <DiscussionsClient
          projectId={projectId}
          embedded
          onSelectThread={(threadId) => setSelectedThreadId(threadId)}
        />
      </div>

      {/* Thread pane (shown when a thread is selected) */}
      <div className={!selectedThreadId ? "hidden" : "h-full min-h-0"}>
        {selectedThreadId && (
          <ThreadClient
            projectId={projectId}
            threadId={selectedThreadId}
            embedded
            onBackToList={() => setSelectedThreadId(null)}
          />
        )}
      </div>
    </div>
  );
}
