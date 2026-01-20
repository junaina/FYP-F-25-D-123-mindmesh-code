"use client";
import { Skeleton } from "@/components/ui/skeleton"; // shadcn/ui Skeleton
import { cn } from "@/lib/utils";

export default function TableSkeleton({
  columns = 3,
  rows = 6,
}: {
  columns?: number;
  rows?: number;
}) {
  // +1 for the title column (“Name”)
  const totalCols = Math.max(1, columns) + 1;

  return (
    <div className="flex flex-col gap-3">
      {/* header bar with action buttons */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {/* header row */}
        <div
          className="grid border-b"
          style={{
            gridTemplateColumns: `minmax(260px,1.2fr) repeat(${
              totalCols - 1
            }, minmax(180px,1fr))`,
          }}
        >
          {Array.from({ length: totalCols }).map((_, i) => (
            <div key={i} className="px-3 py-3">
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        {/* body rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className={cn("grid border-b", r === rows - 1 && "border-b-0")}
            style={{
              gridTemplateColumns: `minmax(260px,1.2fr) repeat(${
                totalCols - 1
              }, minmax(180px,1fr))`,
            }}
          >
            {Array.from({ length: totalCols }).map((__, c) => (
              <div key={c} className="px-3 py-3">
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* footer button skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}
