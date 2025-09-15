"use client";

export default function MeetingHeader({
  title,
  presenter,
}: {
  title: string;
  presenter?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {presenter && (
          <div className="rounded-md bg-secondary px-3 py-1 text-sm">
            <span className="font-medium">{presenter}</span> is presenting
          </div>
        )}
      </div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  );
}
