import SectionHeader from "@/components/section-header";
import { ProjectCard } from "@/components/ui/project-card";
import { ChevronRight } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
export default function HomePage() {
  return (
     <div className="space-y-12">
      {/* Title centered with theme toggle in the top-right */}
      <div className="relative">
        <h1 className="text-3xl font-bold text-center">Home</h1>
        <div className="absolute right-0 top-0">
          <ThemeToggle />
        </div>
      </div>

      {/* Recently Visited (plain cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader>Recently Visited</SectionHeader>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          <ProjectCard title="Task Board" project="Project Alpha" />
          <ProjectCard title="Briefing Doc" project="Project Alpha" />
          <ProjectCard title="Untitled Wiki" project="Project Alpha" />
          <ProjectCard title="Discussions" project="Project Alpha" />
          <ProjectCard title="Another Item" project="Project Beta" />
        </div>
      </div>

      {/* All Projects (cover variant with clickable placeholder) */}
      <div>
        <SectionHeader>All Projects</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProjectCard
            variant="cover"
            title="Project Alpha"
            description="Lorem ipsum dolor sit"
            // Optional: tune the placeholder color/gradient
            placeholder="bg-gradient-to-r from-zinc-700 to-zinc-600"
          />
          <ProjectCard
            variant="cover"
            title="Project Beta"
            description="Lorem ipsum dolor sit"
            placeholder="bg-gradient-to-r from-pink-600 to-pink-600"
          />
        </div>
      </div>
    </div>
  );
}
