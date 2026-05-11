// src/components/desk/views/ThreadView.tsx
"use client";

import ThreadClient from "@/app/(app)/projects/[projectId]/discussions/threads/[threadId]/ThreadClient";
import { makeDiscussionsView } from "@/components/desk/utils/view-utils";

type Props = {
  id: string; // threadId
  params: { projectId: string };
  className?: string;
};

export default function ThreadView({ id, params, className }: Props) {
  if (!params?.projectId) {
    return (
      <div className="p-4 text-sm text-red-500">
        Missing <code>projectId</code> for ThreadView.
      </div>
    );
  }

  const openDiscussions = () => {
    const openDesk =
      ((globalThis as any).openDeskDirect as ((p: any) => void) | undefined) ||
      ((globalThis as any).openDeskTab as ((p: any) => void) | undefined);

    openDesk?.(makeDiscussionsView(params.projectId));
  };

  return (
    <div className={"h-full min-h-0 " + (className ?? "")}>
      <ThreadClient
        projectId={params.projectId}
        threadId={id}
        embedded
        onBackToList={openDiscussions}
      />
    </div>
  );
}
