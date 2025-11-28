import MindyUnderConstruction from "@/components/under-construction/MindyUnderConstruction";

export default function TaskBoardPage({
  params,
}: {
  params: { projectId: string };
}) {
  return (
    <MindyUnderConstruction
      title="Task Board"
      subtitle="We’re building a Kanban-style board that connects directly to your documents, timelines, and discussions."
      badge="Taskboard coming soon"
      backHref="/home"
    />
  );
}
