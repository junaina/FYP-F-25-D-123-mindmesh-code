"use client";

import TaskboardKanban from "@/components/task-board/TaskboardKanban";

export default function TaskboardScreen({ projectId }: { projectId: string }) {
  return <TaskboardKanban projectId={projectId} />;
}
