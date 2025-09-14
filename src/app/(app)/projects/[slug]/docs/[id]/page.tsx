import type { Metadata } from "next";
import type { JSONContent } from "@tiptap/core";
import ClientDoc from "./ClientDoc";

type PageParams = { slug: string; id: string };
type PageProps = { params: Promise<PageParams> };

export const metadata: Metadata = { title: "Wiki" };

export default async function DocPage({ params }: PageProps) {
  const { slug, id } = await params;

  // demo initial data (frontend-only)
  const createdAt = new Date().toISOString();
  const initialTitle = "Briefing Doc: GreenTrace";
  const initialTags = ["Preliminary", "Documentation"];
  const initialDescription = "";

  const initialContent: JSONContent = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Overview" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "This page is frontend-only. Edit and watch state below.",
          },
        ],
      },
    ],
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Project: {slug}</h1>
        <code className="text-xs text-muted-foreground">docId: {id}</code>
      </div>

      <ClientDoc
        initialTitle={initialTitle}
        createdAt={createdAt}
        initialTags={initialTags}
        initialDescription={initialDescription}
        initialContent={initialContent}
      />
    </div>
  );
}
