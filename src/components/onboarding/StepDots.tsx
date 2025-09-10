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
    <div className="absolute bottom-8 inset-x-0 flex justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const id = (i + 1) as StepId;
        return (
          <button
            key={id}
            onClick={() => onPick(id)}
            aria-label={`Go to step ${id}`}
            className={`h-2.5 w-2.5 rounded-full transition ${
              id === active ? "bg-pink-500" : "bg-zinc-700 hover:bg-zinc-600"
            }`}
          />
        );
      })}
    </div>
  );
}
