// src/app/(app)/projects/[projectId]/mesh-meet/page.tsx

import CreateMeetingForm from "@/components/meeting/CreateMeetingForm";

type PageProps = {
  params: {
    projectId: string;
  };
};

export default function ProjectMeshMeetPage({ params }: PageProps) {
  const { projectId } = params;

  return (
    <div className="flex h-full flex-col gap-8 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Mesh Meet</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Create a shareable video meeting link for this project. Anyone with
          the link can join the room, even if they’re outside your organization.
        </p>
      </header>

      <section className="max-w-3xl">
        <CreateMeetingForm projectId={projectId} />
      </section>
    </div>
  );
}
