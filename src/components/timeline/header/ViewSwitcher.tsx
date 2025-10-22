"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { View } from "../grid/TimeScale";
import { normalizeStart } from "../grid/TimeScale";

type Props = {
  view: View;
  start: string;
  className?: string;
  onChangeViewAndStart?: (nextView: View, nextStartISO: string) => void;
};

const VIEWS: View[] = ["hour", "day", "week", "month"];

export default function ViewSwitcher({
  view,
  start,
  className,
  onChangeViewAndStart,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function change(next: View) {
    // keep same start (you can normalize if you want)
    const nextStartISO = start;

    if (onChangeViewAndStart) {
      onChangeViewAndStart(next, nextStartISO); // ✅ embedded (doc) case
    } else {
      // standalone page behavior
      const url = new URL(window.location.href);
      url.searchParams.set("view", next);
      url.searchParams.set("start", nextStartISO);
      router.push(url.pathname + "?" + url.searchParams.toString());
    }
  }

  return (
    <div className={className}>
      <div className="inline-flex rounded-md border bg-card p-1">
        {VIEWS.map((v) => {
          const active = v === view;
          return (
            <button
              key={v}
              onClick={() => change(v)}
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
