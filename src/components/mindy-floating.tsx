"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export function MindyFloating({ projectId }: { projectId: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/projects/${projectId}/ask-mindy`)}
      className="
        fixed bottom-5 right-5 z-50
        h-14 w-14 rounded-full
        bg-background/80 backdrop-blur
        border shadow-md
        hover:scale-105 active:scale-95
        transition
      "
      aria-label="Open Ask Mindy"
      title="Ask Mindy"
    >
      <div className="relative h-full w-full">
        <Image
          src="/ask-mindy.png"
          alt="Mindy"
          fill
          className="object-contain p-2"
          priority={false}
        />
      </div>
    </button>
  );
}
