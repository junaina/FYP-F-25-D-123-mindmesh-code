"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { View } from "../grid/TimeScale";
import { normalizeStart } from "../grid/TimeScale";

type Props = {
  view: View;
  start: string;
  className?: string;
};

const VIEWS: View[] = ["hour", "day", "week", "month"];

export default function ViewSwitcher({ view, start, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const setView = (v: View) => {
    const params = new URLSearchParams(sp?.toString());
    params.set("view", v);
    // normalize start for the newly selected view (month -> 1st, hour -> :00)
    params.set("start", normalizeStart(v, start));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={className}>
      <div className="inline-flex rounded-md border bg-card p-1">
        {VIEWS.map((v) => {
          const active = v === view;
          return (
            <button
              key={v}
              onClick={() => setView(v)}
              className={[
                "px-3 h-8 rounded-sm text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-secondary-foreground hover:bg-accent/10",
              ].join(" ")}
              aria-pressed={active}
            >
              {labelOf(v)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function labelOf(v: View) {
  if (v === "hour") return "Hour";
  if (v === "day") return "Day";
  if (v === "week") return "Week";
  return "Month";
}
