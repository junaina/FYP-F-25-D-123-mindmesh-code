import CreateMeetingForm from "@/components/meeting/CreateMeetingForm";

type MeshMeetPageProps = {
  params: { projectId: string };
};

export default function MeshMeetPage({ params }: MeshMeetPageProps) {
  const { projectId } = params;

  return (
    <div className="px-6 py-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Mesh Meet</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Create a shareable video meeting link for this project. People within
        the project can join the meeting using this link.
      </p>

      <CreateMeetingForm projectId={projectId} />
    </div>
  );
}
