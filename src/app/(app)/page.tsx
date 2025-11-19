import SectionHeader from "@/components/section-header";
import { ProjectCard } from "@/components/ui/project-card";
import ThemeToggle from "@/components/theme-toggle";
import Link from "next/link";

import NewDocumentCard from "@/components/new-document-card";
import { getProjectDashboardServer } from "@/modules/projects/client/dashboard.api";

type Props = { params: { projectId: string } };

export default async function ProjectDashboardPage({ params }: Props) {
  const { projectId } = params;
  const data = await getProjectDashboardServer(projectId);

  return (
    <div className="space-y-12">
      <div className="relative">
        <h1 className="text-3xl font-bold text-center">{data.project.name}</h1>
        <div className="absolute right-0 top-0">
          <ThemeToggle />
        </div>
      </div>

      <section>
        <SectionHeader>Documents</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NewDocumentCard projectId={projectId} />

          {data.documents.length === 0 ? (
            <div className="col-span-full text-sm text-muted-foreground">
              No documents yet.
            </div>
          ) : (
            data.documents.map((doc) => (
              <Link key={doc.id} href={`/projects/${projectId}/docs/${doc.id}`}>
                <ProjectCard
                  variant="cover"
                  title={doc.title || "Untitled"}
                  description=" "
                  placeholder="bg-gradient-to-r from-zinc-700 to-zinc-600"
                />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
