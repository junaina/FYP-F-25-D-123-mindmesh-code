// src/components/meeting/RecordingControls.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  startMeetingRecording,
  stopMeetingRecording,
  getMeetingRecordingStatus,
  MeetingRecordingSummary,
} from "@/modules/meetings/client/meetings.api";

type Props = {
  joinCode: string;
  initialRecording?: MeetingRecordingSummary | null;
  embedded?: boolean;
};

const POLL_INTERVAL_MS = 5000;

export default function RecordingControls({
  joinCode,
  initialRecording = null,
  embedded = false,
}: Props) {
  const [currentRecording, setCurrentRecording] =
    useState<MeetingRecordingSummary | null>(initialRecording);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRecording = useMemo(
    () => currentRecording?.status === "IN_PROGRESS",
    [currentRecording],
  );

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function fetchStatus() {
      try {
        const { recording } = await getMeetingRecordingStatus(joinCode);
        if (!cancelled) {
          setCurrentRecording(recording ?? null);
        }
      } catch (err) {
        console.error("Recording status poll error", err);
      }
    }

    fetchStatus();
    timer = setInterval(fetchStatus, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [joinCode]);

  const handleStart = useCallback(async () => {
    setIsMutating(true);
    setError(null);

    try {
      const { recording } = await startMeetingRecording(joinCode);
      setCurrentRecording(recording);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start recording";
      setError(message);
    } finally {
      setIsMutating(false);
    }
  }, [joinCode]);

  const handleStop = useCallback(async () => {
    setIsMutating(true);
    setError(null);

    try {
      const { recording } = await stopMeetingRecording(joinCode);
      setCurrentRecording(recording);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to stop recording";
      setError(message);
    } finally {
      setIsMutating(false);
    }
  }, [joinCode]);

  const buttonLabel = isRecording ? "Stop recording" : "Start recording";

  // 🔑 Use the S3 key as the token for the download route
  const downloadUrl =
    currentRecording?.status === "COMPLETED" && currentRecording.s3Key
      ? `/api/recordings/${encodeURIComponent(
          // Strip the "recordings/" prefix so the route gets the tail,
          // MeetingRecordingDownloadService will add it back.
          currentRecording.s3Key.startsWith("recordings/")
            ? currentRecording.s3Key.replace(/^recordings\//, "")
            : currentRecording.s3Key,
        )}/download`
      : null;
  const rootClass = embedded
    ? "rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-2 py-1 text-[11px] shadow-lg backdrop-blur"
    : "rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-xs shadow-lg backdrop-blur";

  const buttonClass = embedded
    ? "rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-50 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
    : "rounded-lg border border-zinc-600 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-50 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className={rootClass}>
      <div
        className={
          embedded ? "flex items-center gap-2" : "flex items-center gap-3"
        }
      >
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block ${embedded ? "h-1.5 w-1.5" : "h-2 w-2"} rounded-full ${
              isRecording ? "bg-red-500 animate-pulse" : "bg-zinc-500"
            }`}
          />
          <span className="font-medium text-zinc-100">
            {isRecording ? "Recording…" : "Not recording"}
          </span>
        </div>

        <button
          type="button"
          onClick={isRecording ? handleStop : handleStart}
          disabled={isMutating}
          className={buttonClass}
        >
          {isMutating ? "Working…" : buttonLabel}
        </button>
      </div>

      <div className={embedded ? "mt-1 space-y-1" : "mt-1 space-y-1"}>
        {currentRecording && (
          <p
            className={
              embedded
                ? "text-[10px] text-zinc-400"
                : "text-[11px] text-zinc-400"
            }
          >
            Status:{" "}
            <span className="font-mono uppercase">
              {currentRecording.status}
            </span>
          </p>
        )}

        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className={
              embedded
                ? "inline-block text-[10px] font-medium text-blue-400 underline hover:text-blue-300"
                : "inline-block text-[11px] font-medium text-blue-400 underline hover:text-blue-300"
            }
          >
            Download recording
          </a>
        )}

        {error && (
          <p
            className={
              embedded ? "text-[10px] text-red-400" : "text-[11px] text-red-400"
            }
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
