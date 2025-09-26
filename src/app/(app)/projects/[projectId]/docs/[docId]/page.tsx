// src/app/(app)/projects/[projectId]/docs/[docId]/page.tsx
import ClientDoc from "./ClientDoc";

export const dynamic = "force-dynamic";

type Params = { projectId: string; docId: string };

export default async function Page({
  params,
}: {
  params: Promise<Params>; // Next 15: params is a Promise
}) {
  const { projectId, docId } = await params; // names MUST match folder segments
  console.log("[page] params:", { projectId, docId });
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <ClientDoc projectId={projectId} docId={docId} />
    </main>
  );
}
