"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  title: string;
  description?: string;
  project?: string;

  /** Show a banner area you can click to upload a cover image */
  variant?: "default" | "cover";

  /** Optional initial image url (e.g., from backend later) */
  image?: string;

  /** Placeholder color/gradient classes used when no image yet */
  placeholder?: string;

  /** Optional: get the picked file + blobUrl when user uploads */
  onImageChange?: (file: File, previewUrl: string) => void;

  className?: string;
};

export function ProjectCard({
  title,
  description,
  project,
  variant = "default",
  image,
  placeholder = "bg-gradient-to-r from-indigo-500/60 to-purple-500/60",
  onImageChange,
  className,
}: ProjectCardProps) {
  // local preview for newly-picked image (frontend only)
  const [preview, setPreview] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Clean up blob URLs
  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const openPicker = () => inputRef.current?.click();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    // cleanup old preview url
    if (preview) URL.revokeObjectURL(preview);
    setPreview(url);
    onImageChange?.(file, url);
  };

  if (variant === "cover") {
    const hasImage = !!(preview || image);

    return (
      <Card className={cn("hover:shadow-md transition cursor-pointer overflow-hidden", className)}>
        {/* Clickable banner */}
        <div
          role="button"
          aria-label="Add project cover image"
          onClick={openPicker}
          className={cn(
            "relative h-32 w-full group",
            !hasImage && placeholder, // show placeholder when no image
          )}
        >
          {/* Existing/previewed image */}
          {hasImage && (
            // use <img> for blob preview compatibility
            <img
              src={preview || image}
              alt={title}
              className="h-full w-full object-cover"
            />
          )}

          {/* Hover affordance */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-xs font-medium text-white/95 opacity-0 group-hover:opacity-100 bg-black/20 transition">
            Click to add cover
          </div>

          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        <CardHeader className="p-4">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      </Card>
    );
  }

  // default compact card (Recently Visited)
  return (
    <Card className={cn("hover:shadow-md transition cursor-pointer", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {project && <CardDescription>Project: {project}</CardDescription>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
    </Card>
  );
}
