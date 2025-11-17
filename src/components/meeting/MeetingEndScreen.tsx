// src/components/meeting/MeetingEndScreen.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getMeetingRecap,
  MeetingRecap,
} from "@/modules/meetings/client/meetings.api";

type Props = {
  joinCode: string;
};

export default function MeetingEndScreen({ joinCode }: Props) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [recap, setRecap] = useState<MeetingRecap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState("loading");
      setError(null);

      try {
        const data = await getMeetingRecap(joinCode);
        if (!cancelled) {
          setRecap(data);
          setState("ready");
        }
      } catch (err: any) {
        console.error("Failed to load meeting recap", err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load meeting recap"
          );
          setState("error");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [joinCode]);

  if (state === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading meeting recap…</p>
      </div>
    );
  }

  if (state === "error" || !recap) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-2 text-center">
          <p className="font-medium">Could not load meeting recap</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const { meeting, latestRecording } = recap;
  const canTranscribe =
    !!latestRecording && latestRecording.status === "COMPLETED";

  const createdAt = new Date(meeting.createdAt).toLocaleString();
  const transcriptAt = meeting.transcriptCreatedAt
    ? new Date(meeting.transcriptCreatedAt).toLocaleString()
    : null;

  const handleTranscribeClick = () => {
    // Phase 2: we'll call the transcription endpoint here.
    console.log("Transcribe meeting clicked", {
      joinCode,
      meetingId: meeting.id,
      recording: latestRecording,
    });
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-xl font-semibold">Meeting ended</h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s a quick recap of{" "}
          <span className="font-medium">{meeting.title}</span>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
          <h2 className="text-sm font-medium text-zinc-100">Meeting details</h2>
          <dl className="mt-3 space-y-2 text-xs text-zinc-300">
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-400">Title</dt>
              <dd className="font-medium">{meeting.title}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-400">Status</dt>
              <dd className="font-mono uppercase">{meeting.status}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-400">Started</dt>
              <dd className="font-mono">{createdAt}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-400">Join code</dt>
              <dd className="font-mono text-xs">{meeting.joinCode}</dd>
            </div>
            {transcriptAt && (
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400">Transcript generated</dt>
                <dd className="font-mono text-xs">{transcriptAt}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
          <div>
            <h2 className="text-sm font-medium text-zinc-100">
              Recording status
            </h2>
            <div className="mt-3 text-xs text-zinc-300">
              {latestRecording ? (
                <>
                  <p>
                    Latest recording:{" "}
                    <span className="font-mono uppercase">
                      {latestRecording.status}
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    s3Key:{" "}
                    <span className="font-mono">
                      {latestRecording.s3Key.length > 60
                        ? latestRecording.s3Key.slice(0, 57) + "..."
                        : latestRecording.s3Key}
                    </span>
                  </p>
                </>
              ) : (
                <p>No recordings were created for this meeting.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-zinc-500">
              We&apos;ll use this recording to generate a transcript and AI
              summary in the next phase.
            </p>

            {canTranscribe && (
              <button
                type="button"
                onClick={handleTranscribeClick}
                className="whitespace-nowrap rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800"
              >
                Transcribe meeting
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
