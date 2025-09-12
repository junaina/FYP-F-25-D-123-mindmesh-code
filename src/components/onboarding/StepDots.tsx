"use client";

import { StepId } from "./types";

export default function StepDots({
  active,
  total,
  onPick,
}: {
  active: StepId;
  total: number;
  onPick: (i: StepId) => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-8 flex justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const id = (i + 1) as StepId;
        const isActive = id === active;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            aria-label={`Go to step ${id}`}
            aria-current={isActive ? "step" : undefined}
            className={[
              "h-2.5 w-2.5 rounded-full transition-transform",
              "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              isActive
                ? "bg-[var(--accent)]"
                : "bg-[var(--muted-foreground)] opacity-40 hover:opacity-60",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}
