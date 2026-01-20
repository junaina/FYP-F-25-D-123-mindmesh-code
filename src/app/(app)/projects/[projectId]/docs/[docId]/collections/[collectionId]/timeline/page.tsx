// app/projects/[projectId]/docs/[docId]/collections/[collectionId]/timeline/page.tsx
import TimelineView from "@/components/timeline/TimelineView";

type RouteParams = {
  projectId: string;
  docId: string;
  collectionId: string;
};

type SearchParams = {
  view?: "hour" | "day" | "week" | "month";
  start?: string; // ISO date string
};

export default async function Page({
  params,
  searchParams,
}: {
  // Next.js 15: params/searchParams can be Promises — await them in a Server Component
  params: Promise<RouteParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { projectId, docId, collectionId } = await params;
  const sp = await searchParams;

  // defaults (can be overridden via URL like ?view=day&start=2025-01-01T00:00:00.000Z)
  const view = (sp?.view ?? "day") as "hour" | "day" | "week" | "month";
  const start = sp?.start ?? new Date().toISOString();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Timeline</h1>

      <TimelineView
        projectId={projectId}
        docId={docId}
        collectionId={collectionId}
        view={view}
        start={start}
        nowMs={Date.now()}
      />
    </div>
  );
}
