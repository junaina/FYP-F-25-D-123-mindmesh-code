"use client";

import TaskboardKanban from "@/components/task-board/TaskboardKanban";

export default function TaskboardScreen({
  projectId,
  embedded = false,
  onOpenTask,
}: {
  projectId: string;
  embedded?: boolean;
  onOpenTask?: (doc: { id: string; title?: string }) => void;
}) {
  return (
    <TaskboardKanban
      projectId={projectId}
      embedded={embedded}
      onOpenTask={onOpenTask}
    />
  );
}
