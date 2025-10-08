import { Calendar } from "@/components/calendar/Calendar";
type Params = {
  projectId: string;
  docId: string;
  collectionId: string;
};
export default async function CalendarPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { projectId, docId, collectionId } = await params;
  return (
    <div className="p-4">
      <Calendar
        projectId={projectId}
        docId={docId}
        collectionId={collectionId}
      />
    </div>
  );
}
