"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import DocHeader from "@/components/wiki/DocHeader";
import type { JSONContent } from "@tiptap/core";
import type { UIDocPropertyRow } from "@/types/wiki";
import type { WikiEditorProps } from "@/components/wiki/WikiEditor";

const WikiEditor = dynamic<WikiEditorProps>(
  () => import("@/components/wiki/WikiEditor"),
  { ssr: false }
);

type Props = {
  initialTitle: string;
  createdAt: string;
  initialTags: string[];
  initialDescription: string;
  initialContent: JSONContent;
};

export default function ClientDoc({
  initialTitle,
  createdAt,
  initialTags,
  initialDescription,
  initialContent,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [description, setDescription] = useState(initialDescription);
  const [properties, setProperties] = useState<UIDocPropertyRow[]>([]);
  const [content, setContent] = useState<JSONContent>(initialContent);

  return (
    <div className="space-y-6">
      <DocHeader
        title={title}
        createdAt={createdAt}
        tags={tags}
        description={description}
        onTitleChange={setTitle}
        onTagsChange={setTags}
        onDescriptionChange={setDescription}
        onPropertiesChange={setProperties}
      />

      <WikiEditor
        initialContent={initialContent}
        onChange={(json: JSONContent) => setContent(json)} // ✅ typed
      />

      <div className="rounded-md border p-3 bg-muted/20">
        <div className="text-xs font-medium mb-2 opacity-70">Live state</div>
        <pre className="text-xs whitespace-pre-wrap">
          {JSON.stringify(
            { title, tags, description, properties, content },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
