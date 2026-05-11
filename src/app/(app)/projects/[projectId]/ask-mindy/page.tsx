import AskMindyClient from "@/components/ask-mindy/ask-mindy-client";

export default async function AskMindyPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <AskMindyClient projectId={projectId} />;
}
