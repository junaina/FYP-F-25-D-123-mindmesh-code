// src/components/meeting/MeetingEndScreen.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getMeetingRecap,
  transcribeMeeting,
} from "@/modules/meetings/client/meetings.api";

type Segment = {
  id?: string; // present from GET, ignored on save
  startMs: number;
  endMs: number;
  speakerIndex: number;
  text: string;
};

type Speaker = {
  speakerIndex: number;
  label: string;
};

type TranscriptResponse = {
  transcript: string;
  segments: Segment[];
  speakers: Speaker[];
  transcriptUpdatedAt: string | null;
};

type Props = {
  joinCode: string;
};

function formatMs(ms: number) {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatTimestamp(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

export default function MeetingEndScreen({ joinCode }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [transcript, setTranscript] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // business-rule flags
  const [hasAnyRecording, setHasAnyRecording] = useState(false); // any recording exists
  const [canTranscribe, setCanTranscribe] = useState(false); // latest recording COMPLETED
  const [hasTranscript, setHasTranscript] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Load current transcript from your /transcript route
      const transcriptRes = await fetch(
        `/api/meet/${encodeURIComponent(joinCode)}/transcript`,
        { method: "GET", credentials: "include" }
      );

      if (!transcriptRes.ok) {
        throw new Error(`Failed to load transcript (${transcriptRes.status})`);
      }

      const data = (await transcriptRes.json()) as TranscriptResponse;

      // 2) Load recap to know about recordings + status
      const recap = await getMeetingRecap(joinCode);

      setTranscript(data.transcript ?? "");
      setSegments(data.segments ?? []);

      let speakersFromApi = data.speakers ?? [];

      // If backend sent no speakers but we have segments, derive them
      if (!speakersFromApi.length && data.segments?.length) {
        const uniqueIdx = Array.from(
          new Set(data.segments.map((s) => s.speakerIndex))
        ).sort((a, b) => a - b);

        speakersFromApi = uniqueIdx.map((idx) => ({
          speakerIndex: idx,
          label: `Speaker ${idx + 1}`,
        }));
      }

      setSpeakers(speakersFromApi);
      setLastUpdated(data.transcriptUpdatedAt ?? null);

      // ---- derive flags from recap ----
      const anyTranscript =
        !!data.transcript || (data.segments && data.segments.length > 0);
      setHasTranscript(recap.meeting.hasTranscript || anyTranscript);

      // "any recording exists" (even if still IN_PROGRESS)
      const anyRecording =
        recap.meeting.hasRecording || !!recap.latestRecording;
      setHasAnyRecording(anyRecording);

      // "can transcribe" only when latest recording is COMPLETED
      const latestCompleted =
        !!recap.latestRecording && recap.latestRecording.status === "COMPLETED";
      setCanTranscribe(latestCompleted);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load transcript");
    } finally {
      setLoading(false);
    }
  }, [joinCode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // Only send the fields the PUT route expects (no id)
      const segmentsForSave = segments.map((s) => ({
        startMs: s.startMs,
        endMs: s.endMs,
        speakerIndex: s.speakerIndex,
        text: s.text,
      }));

      const res = await fetch(
        `/api/meet/${encodeURIComponent(joinCode)}/transcript`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            transcript,
            segments: segmentsForSave,
            speakers,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to save transcript (${res.status})`);
      }

      setLastUpdated(new Date().toISOString());
      setHasTranscript(Boolean(transcript || segmentsForSave.length));
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to save transcript");
    } finally {
      setSaving(false);
    }
  }

  async function handleTranscribe() {
    setTranscribing(true);
    setError(null);
    try {
      await transcribeMeeting(joinCode); // kicks off server pipeline
      await loadData(); // reload from DB (/transcript + /recap)
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to transcribe meeting");
    } finally {
      setTranscribing(false);
    }
  }

  function handleSpeakerLabelChange(index: number, label: string) {
    setSpeakers((prev) =>
      prev.map((s) => (s.speakerIndex === index ? { ...s, label } : s))
    );
  }

  function handleAddSpeaker() {
    setSpeakers((prev) => {
      const maxIndex =
        prev.length > 0 ? Math.max(...prev.map((s) => s.speakerIndex)) : -1;
      const nextIndex = maxIndex + 1;

      return [
        ...prev,
        {
          speakerIndex: nextIndex,
          label: `Speaker ${nextIndex + 1}`,
        },
      ];
    });
  }

  function handleSegmentSpeakerChange(segIdx: number, newSpeakerIndex: number) {
    setSegments((prev) =>
      prev.map((seg, i) =>
        i === segIdx ? { ...seg, speakerIndex: newSpeakerIndex } : seg
      )
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-400">
        Loading transcript…
      </div>
    );
  }

  const showTranscribeButton = canTranscribe && !hasTranscript;

  // Helper text under the textarea depending on state
  let transcriptHelper: string | null = null;
  if (!hasAnyRecording) {
    transcriptHelper =
      "This meeting has no recording yet, so a transcript can't be generated.";
  } else if (hasAnyRecording && !canTranscribe && !hasTranscript) {
    transcriptHelper =
      "A recording exists for this meeting, but it's still processing. Once it's finished you'll be able to generate a transcript.";
  } else if (canTranscribe && !transcript && !segments.length) {
    transcriptHelper =
      "No transcript yet. Use the Transcribe button above to generate one from the recording.";
  }

  return (
    <div className="h-full w-full px-8 py-6 text-sm text-neutral-100">
      {error && (
        <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="mx-auto flex max-w-6xl gap-6">
        {/* LEFT: Transcript */}
        <div className="flex-1 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="font-medium tracking-tight">Transcript</h2>
              {lastUpdated && (
                <span className="text-[11px] text-neutral-500">
                  Last updated: {formatTimestamp(lastUpdated)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {showTranscribeButton && (
                <button
                  type="button"
                  onClick={handleTranscribe}
                  disabled={transcribing}
                  className="rounded-full border border-sky-500/60 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200 hover:bg-sky-500/20 disabled:opacity-60"
                >
                  {transcribing ? "Transcribing…" : "Transcribe"}
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>

          <textarea
            className="h-[360px] w-full resize-none rounded-xl border border-neutral-800 bg-neutral-900/80 p-3 text-sm text-neutral-100 outline-none focus:border-neutral-600"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />

          {transcriptHelper && (
            <p className="mt-3 text-xs text-neutral-500">{transcriptHelper}</p>
          )}
        </div>

        {/* RIGHT: Speakers + Segments */}
        <div className="w-[360px] space-y-4">
          {/* Speakers */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Speakers
              </h3>
              <button
                type="button"
                onClick={handleAddSpeaker}
                className="rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-neutral-300 hover:border-neutral-500"
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {speakers.map((sp) => (
                <div
                  key={sp.speakerIndex}
                  className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[10px] text-neutral-300">
                    {sp.speakerIndex + 1}
                  </span>
                  <input
                    className="flex-1 bg-transparent text-xs text-neutral-100 outline-none"
                    value={sp.label}
                    onChange={(e) =>
                      handleSpeakerLabelChange(sp.speakerIndex, e.target.value)
                    }
                    placeholder={`Speaker ${sp.speakerIndex + 1}`}
                  />
                </div>
              ))}

              {!speakers.length && (
                <p className="text-xs text-neutral-500">
                  No speakers yet. Use &ldquo;Add&rdquo; to create one.
                </p>
              )}
            </div>
          </div>

          {/* Segments */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Diarized segments
            </h3>

            <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1 text-xs">
              {segments.map((seg, idx) => (
                <div
                  key={seg.id ?? idx}
                  className="space-y-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
                >
                  <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <span>
                      {formatMs(seg.startMs)} — {formatMs(seg.endMs)}
                    </span>
                    <select
                      className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-100 outline-none"
                      value={seg.speakerIndex}
                      onChange={(e) =>
                        handleSegmentSpeakerChange(idx, Number(e.target.value))
                      }
                    >
                      {speakers.map((sp) => (
                        <option key={sp.speakerIndex} value={sp.speakerIndex}>
                          {sp.label || `Speaker ${sp.speakerIndex + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    className="w-full resize-none bg-transparent text-xs text-neutral-100 outline-none"
                    rows={2}
                    value={seg.text}
                    onChange={(e) =>
                      setSegments((prev) =>
                        prev.map((s, i) =>
                          i === idx ? { ...s, text: e.target.value } : s
                        )
                      )
                    }
                  />
                </div>
              ))}

              {!segments.length && (
                <p className="text-xs text-neutral-500">
                  No diarized segments available for this meeting.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
