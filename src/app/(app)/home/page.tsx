import SectionHeader from "@/components/section-header";
import { ProjectCard } from "@/components/ui/project-card";
import ThemeToggle from "@/components/theme-toggle";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getHomeDataServer } from "@/modules/home/client/home.api";

export default async function HomePage() {
  const { projects, recentDocs } = await getHomeDataServer();

  return (
    <div className="space-y-12">
      <div className="relative">
        <h1 className="text-3xl font-bold text-center">Home</h1>
        <div className="absolute right-0 top-0">
          <ThemeToggle />
        </div>
      </div>

      {/* Recently Visited (documents) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader>Recently Visited</SectionHeader>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {recentDocs.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No recent documents yet.
            </div>
          ) : (
            recentDocs.map((doc) => {
              const pid = doc.project.slug ?? doc.project.id;
              const href = `/projects/${pid}/docs/${doc.id}`;
              return (
                <Link key={doc.id} href={href} className="min-w-[260px]">
                  <ProjectCard
                    title={doc.title || "Untitled"}
                    project={doc.project.name}
                  />
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* All Projects */}
      <section>
        <SectionHeader>All Projects</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map((p) => {
            const href = `/projects/${p.slug ?? p.id}`;
            return (
              <Link key={p.id} href={href}>
                <ProjectCard
                  variant="cover"
                  title={p.name}
                  description=" "
                  placeholder="bg-gradient-to-r from-zinc-700 to-zinc-600"
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
