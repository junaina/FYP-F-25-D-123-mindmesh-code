import TableView from "@/components/table/TableView";

type Props = {
  params: Promise<{ projectId: string; docId: string; collectionId: string }>;
};

export default async function Page({ params }: Props) {
  const { projectId, docId, collectionId } = await params;
  return (
    <div className="p-4">
      <TableView
        projectId={projectId}
        docId={docId}
        collectionId={collectionId}
      />
    </div>
  );
}
