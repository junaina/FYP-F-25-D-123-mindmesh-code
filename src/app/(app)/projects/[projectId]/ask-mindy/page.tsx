import MindyUnderConstruction from "@/components/under-construction/MindyUnderConstruction";

export default function AskMindyPage({
  params,
}: {
  params: { projectId: string };
}) {
  return (
    <MindyUnderConstruction
      title="Ask Mindy"
      subtitle="Soon you’ll be able to ask Mindy questions about your projects, docs, and timelines – all in one place."
      badge="AI copilot in progress"
      backHref="/home"
    />
  );
}
