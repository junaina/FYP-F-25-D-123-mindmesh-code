// app/(app)/projects/[projectId]/docs/[docId]/page.tsx
import { DocumentScreen } from "@/components/wiki/screens/DocumentScreen";

export const dynamic = "force-dynamic";

type Params = { projectId: string; docId: string };

export default function Page({ params }: { params: Params }) {
  const { projectId, docId } = params;

  return (
    <div className="h-[calc(100vh-3rem)] -mx-4 px-4 pt-10 pb-8">
      <DocumentScreen projectId={projectId} docId={docId} />
    </div>
  );
}
