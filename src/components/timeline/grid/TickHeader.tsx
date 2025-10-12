"use client";

import type { Column, View } from "./TimeScale";

export default function TickHeader({
  columns,
  view,
  columnWidth = 96,
  showTodayDot = view === "week" || view === "month", // default: on for week/month
}: {
  columns: Column[];
  view: View;
  columnWidth?: number;
  showTodayDot?: boolean;
}) {
  const isPillView = view === "week" || view === "month";

  const todayIdx = showTodayDot ? columns.findIndex((c) => c.isToday) : -1;
  const todayCenterPx = todayIdx >= 0 ? (todayIdx + 0.5) * columnWidth : null;

  const contentWidth = columns.length * columnWidth;

  return (
    <div className="px-3 pt-2 select-none z-30">
      <div className="relative w-full">
        {/* Capsule rail spans the full content width */}
        <div
          className="mx-auto h-8 rounded-full px-2 flex items-center whitespace-nowrap"
          style={{
            width: contentWidth,
            background: "color-mix(in oklab, var(--muted) 92%, transparent)",
            border:
              "1px solid color-mix(in oklab, var(--border) 80%, transparent)",
          }}
        >
          {columns.map((c, i) => {
            const label =
              view === "day"
                ? formatHour12(c.start)
                : view === "hour"
                ? c.start.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : String(c.day);

            const contentClass = isPillView
              ? [
                  "inline-flex items-center justify-center rounded-full h-6 min-w-6 px-2 font-medium",
                  c.isToday
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-secondary-foreground",
                ].join(" ")
              : "inline-flex items-center justify-center h-6 min-w-6 px-1 text-[12px] md:text-xs text-secondary-foreground";

            return (
              <span
                key={i}
                className={contentClass}
                style={{
                  display: "inline-block",
                  width: columnWidth,
                  textAlign: "center",
                }}
              >
                {label}
              </span>
            );
          })}
        </div>

        {/* Red dot (week/month only), positioned in px */}
        {showTodayDot && todayCenterPx !== null && (
          <div
            className="absolute -bottom-3"
            style={{ left: todayCenterPx - 8 }}
          >
            <div className="h-4 w-4 rounded-full bg-[var(--accent)] border border-[var(--accent)] shadow-md" />
          </div>
        )}
      </div>

      <div
        className="mt-3 h-px"
        style={{
          background: "color-mix(in oklab, var(--border) 70%, transparent)",
        }}
      />
    </div>
  );
}

function formatHour12(d: Date) {
  return d
    .toLocaleTimeString([], { hour: "numeric", hour12: true })
    .replace(/\s/g, " ")
    .toUpperCase();
}
