"use client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useDeleteTimelineEvent } from "@/modules/timeline/client/useDeleteTimelineEvent";
import { useToast } from "@/hooks/use-toast";
import { PropertyChipsByName } from "@/components/properties/chips/PropertyChips";

type EventChipProps = {
  title: string;
  compact?: boolean;
  values?: Record<string, unknown>; // name -> value
  visible?: Set<string>; // which property names are visible
  metaByName?: Map<
    string,
    {
      id: string;
      name: string;
      kind: string;
      options?: { id: string; value: string; color?: string | null }[];
    }
  >;

  onClick?: () => void;
  className?: string;
};

export default function EventChip({
  title,
  compact = false,
  values = {},
  visible,
  onClick,
  className,
  metaByName,
}: EventChipProps) {
  // Filter & prepare values that will actually be shown
  const entries = Object.entries(values).filter(([name, v]) => {
    if (visible && !visible.has(name)) return false;
    const s = String(v ?? "").trim();
    return s.length > 0;
  });
  console.log("[EventChip]", {
    title,
    keys: Object.keys(values ?? {}),
    visible: visible ? Array.from(visible) : "(no filter)",
    metaByNameSize: metaByName?.size ?? 0,
  });

  return (
    <div className="relative w-full pointer-events-auto">
      <div
        onClick={onClick}
        className={[
          "box-border w-full rounded-lg border shadow-lg cursor-pointer select-none",
          "bg-muted border-muted-foreground/10",
          "text-[color-mix(in_oklab,var(--foreground)_92%,white)]",
          "transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--card)_75%,black)]",
          compact ? "px-2 py-1 min-w-[140px]" : "px-3 py-2",
          className ?? "",
        ].join(" ")}
        // keep overflow visible so rounded corners don't clip the pills' subtle shadows
        style={{ overflow: "visible" }}
      >
        {/* --- Title row (always first) --- */}
        <div
          className={[
            "truncate leading-5",
            compact ? "text-[13px] font-medium" : "text-sm font-semibold",
          ].join(" ")}
          title={title}
        >
          {title}
        </div>

        {/* --- Properties below title (only when not compact) --- */}
        {!compact && entries.length > 0 && (
          <div
            className=" mt-1 space-y-1 max-h-[40vh]
      overflow-y-auto overflow-x-auto     
      overscroll-contain flex flex-col gap-1
      min-w-0 mm-scrollbar"
          >
            {entries.map(([name, raw]) => {
              // inside entries.map(...) in EventChip.tsx
              const kind = metaByName?.get(name)?.kind;
              const isChipKind =
                kind === "select" ||
                kind === "multi_select" ||
                kind === "status";

              if (isChipKind) {
                return (
                  <div key={name}>
                    <PropertyChipsByName
                      propertyName={name}
                      raw={raw}
                      metaByName={metaByName ?? new Map()}
                      titlePrefix={name}
                    />
                  </div>
                );
              }

              // ✅ render non-chip kinds as a gray chip that WRAPS
              const pretty = formatValue(raw, name);
              if (!pretty) return null;

              return (
                <span
                  key={name}
                  className="mm-chip mm-chip--gray mm-anywhere max-w-full"
                >
                  {pretty}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact, readable formatting for property values. */
function formatValue(v: unknown, name?: string): string {
  if (v == null) return "";
  // Show short, readable dates/times for ISO strings
  if (typeof v === "string") {
    const iso = tryParseISO(v);
    if (iso) {
      // If the property looks like a date/time (e.g., "start" or "end") show a terse format
      return shortDateTime(iso);
    }
    return v;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => String(x ?? "")).join(", ");
  // generic object → JSON-ish
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function tryParseISO(s: string): Date | null {
  // very lenient: only attempt when it looks like an ISO datetime
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return null;
  const d = new Date(s);
  return Number.isNaN(+d) ? null : d;
}

function shortDateTime(d: Date): string {
  // keep it short; you can swap locale if you prefer
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const date = d.toLocaleDateString([], { month: "short", day: "numeric" });
  // If it’s today, show only time; otherwise show date + time
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay ? time : `${date} ${time}`;
}
