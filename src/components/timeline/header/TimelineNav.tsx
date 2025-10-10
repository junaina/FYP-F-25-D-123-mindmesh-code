"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { stepStart, normalizeStart } from "../grid/TimeScale";
import type { View } from "../grid/TimeScale";

type Props = {
  view: View;
  start: string;
  className?: string;
};

export default function TimelineNav({ view, start, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const go = (newStartISO: string) => {
    const params = new URLSearchParams(sp?.toString());
    params.set("view", view);
    params.set("start", newStartISO);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const onPrev = () => go(stepStart(view, start, -1));
  const onNext = () => go(stepStart(view, start, +1));
  const onToday = () => go(normalizeStart(view, new Date().toISOString()));

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-card hover:bg-accent/10"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={onToday}
          className="inline-flex h-8 px-3 items-center justify-center rounded-md border bg-card text-sm font-medium hover:bg-accent/10"
        >
          Today
        </button>

        <button
          onClick={onNext}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-card hover:bg-accent/10"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
