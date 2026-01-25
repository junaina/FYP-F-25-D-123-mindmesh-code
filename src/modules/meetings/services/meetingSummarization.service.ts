import { MeetingRepo } from "@/modules/meetings/repo/meeting.repo";
import { MeetingSegmentRepo } from "@/modules/meetings/repo/meetingSegment.repo";
import { MeetingSpeakerRepo } from "@/modules/meetings/repo/meetingSpeaker.repo";
import {
  summarizeViaPythonSummarizer,
  type SummarizerFormat,
} from "@/modules/meetings/client/summarizer.client";

export class NotFoundError extends Error {
  override name = "NotFoundError";
}
export class ForbiddenError extends Error {
  override name = "ForbiddenError";
}
export class TranscriptMissingError extends Error {
  override name = "TranscriptMissingError";
}
function msToMMSS(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function buildTranscriptFromSegments(args: {
  segments: { startMs: number; speakerIndex: number; text: string }[];
  speakerLabelByIndex: Map<number, string>;
}) {
  const { segments, speakerLabelByIndex } = args;

  return segments
    .map((seg) => {
      const label =
        speakerLabelByIndex.get(seg.speakerIndex) ??
        `Speaker ${seg.speakerIndex + 1}`;
      const t = (seg.text ?? "").trim();
      if (!t) return null;

      // Nice structure for later models + current extractive stage
      return `[${msToMMSS(seg.startMs)}] ${label}: ${t}`;
    })
    .filter(Boolean)
    .join("\n");
}
export async function summarizeMeetingForJoinCode(args: {
  joinCode: string;
  userId: string;
  options?: { format?: SummarizerFormat; maxTokens?: number };
}) {
  const meeting = await MeetingRepo.findMeetingByJoinCode(args.joinCode);
  if (!meeting) throw new NotFoundError("Meeting not found");

  const isMember = await MeetingRepo.isProjectMember(
    meeting.projectId,
    args.userId,
  );
  if (!isMember)
    throw new ForbiddenError("You are not a member of this project");

  // ✅ Prefer segments (structured) → fallback to Meeting.transcript (blob)
  const segments = await MeetingSegmentRepo.listForMeeting(meeting.id);

  let transcript = "";
  if (segments.length) {
    const speakers = await MeetingSpeakerRepo.getSpeakersForMeeting(meeting.id);
    const speakerLabelByIndex = new Map(
      speakers.map((s) => [s.speakerIndex, s.label]),
    );

    transcript = buildTranscriptFromSegments({ segments, speakerLabelByIndex });
  }

  if (!transcript.trim()) {
    transcript = (meeting.transcript ?? "").trim();
  }

  if (!transcript.trim()) {
    throw new TranscriptMissingError(
      "No transcript found for this meeting. Transcribe the meeting first.",
    );
  }
  //note to self tis is the sumamrizer client function that calls the fast api
  return summarizeViaPythonSummarizer({
    meetingId: meeting.id,
    transcript,
    options: args.options,
  });
}
