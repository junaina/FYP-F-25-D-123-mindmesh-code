// src/components/meeting/MeetingEndScreen.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMeetingRecap,
  MeetingRecap,
  transcribeMeeting,
  MeetingTranscriptResponse,
} from "@/modules/meetings/client/meetings.api";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type Props = {
  joinCode: string;
};

export default function MeetingEndScreen({ joinCode }: Props) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [recap, setRecap] = useState<MeetingRecap | null>(null);

  const [transcript, setTranscript] =
    useState<MeetingTranscriptResponse | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recap info when the page mounts
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getMeetingRecap(joinCode);
        if (!cancelled) {
          setRecap(data);
          setState("ready");
        }
      } catch (err) {
        console.error("Failed to load meeting recap", err);
        if (!cancelled) {
          setState("error");
          setError("Couldn't load meeting details.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [joinCode]);

  const handleTranscribeClick = async () => {
    if (!joinCode || isTranscribing) return;

    setIsTranscribing(true);
    setError(null);

    try {
      const result = await transcribeMeeting(joinCode);
      setTranscript(result);

      // Optimistically update recap flags
      setRecap((prev) =>
        prev
          ? {
              ...prev,
              meeting: {
                ...prev.meeting,
                hasTranscript: true,
                transcriptCreatedAt: new Date().toISOString(),
              },
            }
          : prev
      );
    } catch (err: any) {
      console.error("Failed to transcribe meeting", err);
      setError(
        err?.message ?? "We couldn't transcribe this meeting. Please try again."
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const canTranscribe =
    !!recap &&
    !!recap.latestRecording &&
    recap.latestRecording.status === "COMPLETED" &&
    !isTranscribing;

  const transcriptToShow = useMemo(() => transcript, [transcript]);

  const formatMs = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (state === "loading") {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-300">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          <span>Loading meeting summary…</span>
        </div>
      </div>
    );
  }

  if (state === "error" || !recap) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-red-900/60 bg-red-950/60 px-4 py-3 text-sm text-red-100">
          <AlertCircle className="h-4 w-4" />
          <span>{error ?? "Something went wrong loading this meeting."}</span>
        </div>
      </div>
    );
  }

  const { meeting, latestRecording } = recap;

  return (
    <div className="flex h-full flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-6 shadow-xl shadow-black/60">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Meeting ended
            </div>
            <h1 className="mt-1 text-xl font-semibold text-zinc-50">
              {meeting.title}
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Join code{" "}
              <span className="font-mono text-zinc-300">
                {meeting.joinCode}
              </span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              <span>
                {meeting.hasTranscript ? "Transcript ready" : "Recording ready"}
              </span>
            </div>

            {canTranscribe && (
              <button
                type="button"
                onClick={handleTranscribeClick}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 shadow-sm hover:border-zinc-500 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canTranscribe}
              >
                {isTranscribing && (
                  <Loader2 className="h-3 w-3 animate-spin text-zinc-300" />
                )}
                <span>
                  {isTranscribing ? "Transcribing…" : "Transcribe meeting"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="mt-6 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/40 p-4">
          {!latestRecording && (
            <p className="text-sm text-zinc-400">
              This meeting doesn&apos;t have a recording attached yet, so
              there&apos;s nothing to transcribe.
            </p>
          )}

          {latestRecording && !meeting.hasTranscript && !transcriptToShow && (
            <p className="text-sm text-zinc-400">
              A recording exists for this meeting, but the transcript isn&apos;t
              ready yet.{" "}
              {canTranscribe && (
                <span className="font-medium text-zinc-200">
                  Click &ldquo;Transcribe meeting&rdquo; to generate it.
                </span>
              )}
            </p>
          )}

          {error && (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-red-900/60 bg-red-950/60 px-3 py-2 text-xs text-red-100">
              <AlertCircle className="h-3 w-3" />
              <span>{error}</span>
            </div>
          )}

          {transcriptToShow && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">
                  Transcript
                </h2>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                  {transcriptToShow.segments.length} segments ·{" "}
                  {transcriptToShow.transcript.length} chars
                </p>
              </div>

              <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-zinc-800/80 bg-zinc-950/80 px-3 py-2">
                {transcriptToShow.segments.map((seg, idx) => (
                  <div
                    key={`${seg.startMs}-${seg.endMs}-${idx}`}
                    className="flex gap-3 border-b border-zinc-800/70 pb-2 last:border-b-0 last:pb-0"
                  >
                    <div className="w-28 shrink-0 text-[11px] text-zinc-500">
                      <div className="font-medium text-zinc-300">
                        Speaker {seg.speakerIndex + 1}
                      </div>
                      <div className="mt-0.5 font-mono">
                        {formatMs(seg.startMs)} – {formatMs(seg.endMs)}
                      </div>
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-zinc-100">
                      {seg.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
