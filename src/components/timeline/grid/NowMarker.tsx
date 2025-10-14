"use client";
import { useEffect, useState } from "react";

export default function NowMarker({
  startMs,
  endMs,
  nowMs,
  tickMs = 60_000,
}: {
  startMs: number;
  endMs: number;
  nowMs?: number;
  tickMs?: number;
}) {
  const [now, setNow] = useState<number | null>(nowMs ?? null);

  useEffect(() => {
    if (now == null) setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickMs]);

  if (now == null) return null;

  const span = Math.max(1, endMs - startMs);
  const pct = ((now - startMs) / span) * 100;
  const visible = Number.isFinite(pct) && pct >= 0 && pct <= 100;
  if (!visible) return null;

  return (
    <div
      className="absolute top-0 bottom-0 z-20"
      style={{ left: `${pct}%` }}
      suppressHydrationWarning
    >
      <div className="mm-today absolute top-0 bottom-0 w-[2px] bg-[var(--accent)]" />
    </div>
  );
}
