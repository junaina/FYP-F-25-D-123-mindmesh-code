"use client";

import type { Column } from "./TimeScale";
import clsx from "clsx";

export default function GridBands({
  columns,
  columnWidth = 96,
  height = "h-44 md:h-56",
  children,
}: {
  columns: Column[];
  columnWidth?: number;
  height?: string;
  children?: React.ReactNode;
}) {
  // softer hairline color and defined z-index layers to avoid weird overlaps
  const line = "color-mix(in oklab, var(--grid-line) 38%, transparent)";
  const contentWidth = columns.length * columnWidth;

  return (
    <div
      className={clsx("relative w-full overflow-hidden rounded-b-xl", height)}
    >
      <div
        className="relative h-full mx-auto"
        style={{ width: contentWidth, transform: "translateZ(0)" }}
      >
        {/* top/bottom hairlines */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px z-10"
          style={{
            background: "color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px z-10"
          style={{
            background: "color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        />

        {/* ===== NEW: per-column background (no grouping) ===== */}
        {columns.map((c, i) => {
          // prefer a standard 'band' property if you have it; else derive:
          const band =
            (c as any).band ??
            (c as any).weekBand ??
            // fallback: every 7 columns behave like a band
            Math.floor(i / 7);

          const leftPx = i * columnWidth;
          const fill =
            band % 2 === 0
              ? "transparent"
              : "color-mix(in oklab, var(--muted) 86%, transparent)";

          return (
            <div
              key={`bg-${i}`}
              className="pointer-events-none absolute inset-y-0 z-0"
              style={{ left: leftPx, width: columnWidth, background: fill }}
            />
          );
        })}

        {/* column hairlines on top of backgrounds */}
        {columns.map((_, i) => (
          <div
            key={`line-${i}`}
            className="pointer-events-none absolute top-0 bottom-0 z-20"
            style={{
              left: i * columnWidth,
              width: 1,
              borderRight: `1px solid ${line}`,
              mixBlendMode: "var(--grid-blend)" as any,
              opacity: 0.35,
            }}
          />
        ))}

        {/* children (today line, events) above everything */}
        <div className="absolute inset-0 z-30">{children}</div>
      </div>
    </div>
  );
}
