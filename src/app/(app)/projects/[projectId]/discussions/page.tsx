import DiscussionsClient from "./DiscussionsClient";

export default async function DiscussionsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <DiscussionsClient projectId={projectId} />;
}