import HeaderWrapper from "@/components/wiki/header/HeaderWrapper";
import EditorWrapper from "@/components/wiki/editor/EditorWrapper";
export const dynamic = "force-dynamic";

type Params = { projectId: string; docId: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { projectId, docId } = await params;
  console.log("[page] params:", { projectId, docId });
  return (
    <main className="mx-auto max-w-6xl px-6 pt-10 pb-8 space-y-9">
      {/*sidebar goes here*/}
      <HeaderWrapper projectId={projectId} docId={docId} />
      {/*wiki editor goes here*/}

      <EditorWrapper projectId={projectId} docId={docId}></EditorWrapper>
    </main>
  );
}
