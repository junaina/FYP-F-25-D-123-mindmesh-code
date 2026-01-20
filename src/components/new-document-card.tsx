"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "@/components/ui/project-card";
import { createProjectDocument } from "@/modules/documents/client/docs.api";

export default function NewDocumentCard({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        start(async () => {
          const { id } = await createProjectDocument(projectId);
          router.push(`/projects/${projectId}/docs/${id}`);
        })
      }
      className="text-left"
      disabled={pending}
    >
      <ProjectCard
        variant="cover"
        title={pending ? "Creating..." : "New Document"}
        description=" "
        placeholder="bg-gradient-to-r from-zinc-700 to-zinc-600"
      />
    </button>
  );
}
