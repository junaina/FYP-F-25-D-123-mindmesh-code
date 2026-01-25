"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  generateMeetingSummary,
  type MeetingSummaryResult,
} from "@/modules/meetings/client/meetings.api";

type Props = { joinCode: string };

const LS_KEY_PREFIX = "mindmesh:meetingSummary:";

type ExportDriveResponse =
  | { kind: "needs_oauth"; redirectUrl: string }
  | { kind: "uploaded"; driveFileUrl?: string | null };

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function MeetingSummary({ joinCode }: Props) {
  const router = useRouter();

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [data, setData] = useState<MeetingSummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingToDrive, setSavingToDrive] = useState(false);

  const lsKey = useMemo(() => `${LS_KEY_PREFIX}${joinCode}`, [joinCode]);

  const loadFromCache = useCallback(() => {
    try {
      const raw = localStorage.getItem(lsKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as MeetingSummaryResult;
      if (!parsed?.summary) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [lsKey]);

  const saveToCache = useCallback(
    (value: MeetingSummaryResult) => {
      try {
        localStorage.setItem(lsKey, JSON.stringify(value));
      } catch {
        // ignore
      }
    },
    [lsKey],
  );

  const runGenerate = useCallback(
    async (force = false) => {
      setError(null);
      setStatus("loading");

      try {
        if (!force) {
          const cached = loadFromCache();
          if (cached) {
            setData(cached);
            setStatus("ready");
            return cached;
          }
        }
        //the api function that calls the next js route
        const result = await generateMeetingSummary(joinCode);
        setData(result);
        saveToCache(result);
        setStatus("ready");
        return result;
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Failed to generate summary";
        setError(msg);
        setStatus("error");
        return null;
      }
    },
    [joinCode, loadFromCache, saveToCache],
  );

  /**
   * SAME pattern as transcript:
   * - POST export endpoint
   * - if needs_oauth -> redirect
   * - if uploaded -> success
   * - supports ?driveExport=resume to auto-retry after OAuth
   */
  const handleSaveToDrive = useCallback(
    async (auto = false) => {
      setSavingToDrive(true);
      if (!auto) setError(null);

      try {
        // Ensure we have a summary to export (like "save then export")
        const current = data ?? (await runGenerate(false));
        if (!current) throw new Error("No summary available to export.");

        // IMPORTANT:
        // Use a dedicated summary export endpoint.
        // This mirrors your transcript export pattern and keeps the FE stable.
        const res = await fetch(
          `/api/meet/${encodeURIComponent(joinCode)}/summary/export/drive`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              summary: current.summary,
              actionItems: current.actionItems,
              generatedAt: current.generatedAt,
              provider: current.provider,
            }),
          },
        );

        if (!res.ok) {
          throw new Error(`Failed to export summary to Drive (${res.status})`);
        }

        const out = (await res.json()) as ExportDriveResponse;

        if (out.kind === "needs_oauth") {
          // Just like your transcript export: redirect to OAuth
          window.location.href = out.redirectUrl;
          return;
        }

        if (out.kind === "uploaded") {
          if (!auto) alert("Summary uploaded to Google Drive");
          // Optional: if (out.driveFileUrl) window.open(out.driveFileUrl, "_blank");
        }
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Failed to export summary to Drive";
        if (!auto) setError(msg);
      } finally {
        setSavingToDrive(false);
      }
    },
    [data, joinCode, runGenerate],
  );

  // Auto-generate on first mount (cache-first)
  useEffect(() => {
    runGenerate(false);
  }, [runGenerate]);

  // OAuth resume pattern: /summary?driveExport=resume
  useEffect(() => {
    const url = new URL(window.location.href);
    const flag = url.searchParams.get("driveExport");
    if (flag === "resume") {
      url.searchParams.delete("driveExport");
      window.history.replaceState({}, "", url.pathname + url.search);

      handleSaveToDrive(true);
    }
  }, [handleSaveToDrive]);

  return (
    <div className="h-full w-full px-8 py-6 text-sm text-neutral-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight">
              AI Meeting Summary
            </h1>
            <p className="text-xs text-neutral-500">
              Join code: <span className="text-neutral-300">{joinCode}</span>
              {data?.generatedAt ? (
                <>
                  {" "}
                  · Generated:{" "}
                  <span className="text-neutral-300">
                    {formatTimestamp(data.generatedAt)}
                  </span>
                </>
              ) : null}
              {data?.provider ? (
                <>
                  {" "}
                  · Provider:{" "}
                  <span className="text-neutral-300">{data.provider}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/mesh-meet/${joinCode}/ended`)}
              className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-medium text-neutral-200 hover:border-neutral-500"
            >
              Back to recap
            </button>

            <button
              type="button"
              onClick={() => handleSaveToDrive(false)}
              disabled={savingToDrive || status === "loading"}
              className="rounded-full border border-indigo-500/60 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200 hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              title="Export the generated summary to Google Drive"
            >
              {savingToDrive ? "Saving to Drive…" : "Save to Drive"}
            </button>

            <button
              type="button"
              onClick={() => runGenerate(true)}
              disabled={status === "loading"}
              className="rounded-full border border-fuchsia-500/60 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-200 hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              title="Regenerate summary (ignores cache)"
            >
              {status === "loading" ? "Generating…" : "Regenerate"}
            </button>
          </div>
        </div>

        {status === "error" && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error ?? "Something went wrong."}
          </div>
        )}

        {status === "loading" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
              <div className="mb-3 h-4 w-32 animate-pulse rounded bg-neutral-800" />
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-neutral-800" />
                <div className="h-3 w-11/12 animate-pulse rounded bg-neutral-800" />
                <div className="h-3 w-10/12 animate-pulse rounded bg-neutral-800" />
                <div className="h-3 w-9/12 animate-pulse rounded bg-neutral-800" />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
              <div className="mb-3 h-4 w-40 animate-pulse rounded bg-neutral-800" />
              <div className="space-y-2">
                <div className="h-3 w-10/12 animate-pulse rounded bg-neutral-800" />
                <div className="h-3 w-9/12 animate-pulse rounded bg-neutral-800" />
                <div className="h-3 w-8/12 animate-pulse rounded bg-neutral-800" />
              </div>
            </div>
          </div>
        )}

        {status === "ready" && data && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Summary */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Summary
              </h2>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-100">
                {data.summary}
              </div>
            </div>

            {/* Action Items */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Action items extracted
              </h2>

              {data.actionItems.length ? (
                <ul className="space-y-2 text-sm">
                  {data.actionItems.map((item, idx) => (
                    <li
                      key={`${idx}-${item.slice(0, 12)}`}
                      className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[10px] text-neutral-300">
                          {idx + 1}
                        </span>
                        <span className="text-neutral-100">{item}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-neutral-500">
                  No action items found yet. You can regenerate or improve
                  extraction later.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
