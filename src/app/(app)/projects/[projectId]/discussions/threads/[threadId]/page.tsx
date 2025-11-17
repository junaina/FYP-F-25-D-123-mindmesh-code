import ThreadClient from "./ThreadClient";

export default function ThreadPage({
  params,
}: {
  params: { projectId: string; threadId: string };
}) {
  const { projectId, threadId } = params;

  return <ThreadClient projectId={projectId} threadId={threadId} />;
}