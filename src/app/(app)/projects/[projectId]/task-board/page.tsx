import TaskboardScreen from "@/components/task-board/TaskboardScreen";

export default function TaskBoardPage({
  params,
}: {
  params: { projectId: string };
}) {
  return <TaskboardScreen projectId={params.projectId} />;
}
