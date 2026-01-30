"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createProjectDocument } from "@/modules/documents/client/docs.api"; // adjust path if yours differs

export function NewDocButton({
  projectId,
  defaultTitle = "Untitled",
  className,
}: {
  projectId: string;
  defaultTitle?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const onCreate = () => {
    if (pending) return;

    startTransition(async () => {
      const { id } = await createProjectDocument(projectId, defaultTitle);

      // ✅ adjust this route if your doc page is different
      router.push(`/projects/${projectId}/docs/${id}`);
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onCreate}
      disabled={pending}
      className={className}
      aria-label="Create new document"
      title="New document"
    >
      <Plus className="h-4 w-4" />
    </Button>
  );
}
