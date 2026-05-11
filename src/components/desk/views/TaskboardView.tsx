"use client";

import TaskboardScreen from "@/components/task-board/TaskboardScreen";
import { makeDocView } from "../utils/view-utils";

type Props = {
  id: string; // stable (usually projectId)
  params: { projectId: string };
  className?: string;
};

export default function TaskboardView({ params, className }: Props) {
  const projectId = params?.projectId;

  if (!projectId) {
    return (
      <div className="p-4 text-sm text-red-500">
        Missing <code>projectId</code> for TaskboardView.
      </div>
    );
  }

  function openDocInDesk(doc: { id: string; title?: string }) {
    const payload = makeDocView(projectId, { id: doc.id, title: doc.title });

    const openDeskDirect =
      ((globalThis as any).openDeskDirect as ((p: any) => void) | undefined) ||
      ((globalThis as any).openDeskTab as ((p: any) => void) | undefined);

    openDeskDirect?.(payload);
  }

  return (
    <div className={"h-full min-h-0 overflow-hidden " + (className ?? "")}>
      <TaskboardScreen
        projectId={projectId}
        embedded
        onOpenTask={openDocInDesk}
      />
    </div>
  );
}
