import OpenAI, { toFile } from "openai";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { MeetingRepo } from "@/modules/meetings/repo/meeting.repo";
import { MeetingRecordingRepo } from "@/modules/meetings/repo/meetingRecording.repo";
import { MeetingSpeakerRepo } from "@/modules/meetings/repo/meetingSpeaker.repo";
import { MeetingSegmentRepo } from "@/modules/meetings/repo/meetingSegment.repo"; // you already had this

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const S3_BUCKET = process.env.S3_BUCKET!;
const S3_REGION = process.env.S3_REGION!;

const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
});

export class NotFoundError extends Error {
  override name = "NotFoundError";
}
export class ForbiddenError extends Error {
  override name = "ForbiddenError";
}

type TranscribeArgs = {
  joinCode: string;
  userId: string;
};
type SegmentDTO = {
  startMs: number;
  endMs: number;
  speakerIndex: number;
  text: string;
};

type SpeakerDTO = {
  speakerIndex: number;
  label: string;
};

type UpdateTranscriptArgs = {
  joinCode: string;
  userId: string;
  transcript: string;
  segments: SegmentDTO[];
  speakers: SpeakerDTO[];
};

export const MeetingTranscriptionService = {
  async transcribeLatestRecordingForJoinCode({
    joinCode,
    userId,
  }: TranscribeArgs) {
    const meeting = await MeetingRepo.findMeetingByJoinCode(joinCode);
    if (!meeting) throw new NotFoundError("Meeting not found");

    const isMember = await MeetingRepo.isProjectMember(
      meeting.projectId,
      userId
    );
    if (!isMember)
      throw new ForbiddenError("You are not a member of this project");

    const rec = await MeetingRecordingRepo.findLatestRecordingForMeeting(
      meeting.id
    );
    if (!rec || !rec.s3Key)
      throw new NotFoundError("No recording for this meeting");
    if (rec.status !== "COMPLETED")
      throw new Error("Recording is not yet completed");

    // --- S3 download ---
    const s3Obj = await s3Client.send(
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: rec.s3Key })
    );
    const bytes = await s3Obj.Body?.transformToByteArray();
    if (!bytes) throw new Error("Failed to read audio from S3");

    const buffer = Buffer.from(bytes);
    console.log("Downloaded audio length:", buffer.length);

    const file = await toFile(buffer, "recording.mp4");

    // --- OpenAI call ---
    const rawResult: any = await openai.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe-diarize",
      response_format: "diarized_json",
      chunking_strategy: "auto",
    });

    console.dir(rawResult, { depth: null });

    // diarized_json may come back either as an object or as a JSON string; handle both
    let result = rawResult;
    if (typeof rawResult === "string") {
      try {
        result = JSON.parse(rawResult);
      } catch {
        // leave as string
      }
    }

    // --- map speakers -> numeric indices ---
    const speakerMap = new Map<string, number>();
    let nextSpeakerIndex = 0;

    const getSpeakerIndex = (raw: unknown): number => {
      // If it's already a finite number, use it
      if (typeof raw === "number" && Number.isFinite(raw)) {
        return raw;
      }

      const key = raw == null ? "unknown" : String(raw); // e.g. "A", "B", "unknown"

      const existing = speakerMap.get(key);
      if (existing !== undefined) return existing;

      const idx = nextSpeakerIndex++;
      speakerMap.set(key, idx);
      return idx;
    };

    let segments: {
      startMs: number;
      endMs: number;
      speakerIndex: number;
      text: string;
    }[] = [];

    // 1) diarized path (preferred)
    if (result && Array.isArray(result.segments)) {
      segments = result.segments.map((seg: any) => ({
        startMs: Math.round((seg.start ?? 0) * 1000),
        endMs: Math.round((seg.end ?? 0) * 1000),
        speakerIndex: getSpeakerIndex(seg.speaker), // <— FIX HERE
        text: String(seg.text ?? "").trim(),
      }));
    }

    // 2) fallback: plain text, no diarization
    let fullTranscript = "";

    // we only create the fallback segment if there was no diarization
    // AND the text is actually non-empty
    if (
      segments.length === 0 &&
      typeof result?.text === "string" &&
      result.text.trim().length > 0
    ) {
      const text = result.text.trim();
      fullTranscript = text;
      segments = [
        {
          startMs: 0,
          endMs: 0,
          speakerIndex: getSpeakerIndex(0),
          text,
        },
      ];
    }

    // Remove empty-text segments, then build transcript if we still don't have one
    const nonEmptySegments = segments.filter((s) => s.text.length > 0);

    if (!fullTranscript && nonEmptySegments.length > 0) {
      fullTranscript = nonEmptySegments.map((s) => s.text).join(" ");
    }

    console.log("Segment count:", segments.length);
    console.log("Transcript length:", fullTranscript.length);

    // Persist segments
    await MeetingSegmentRepo.deleteSegmentsForMeeting(meeting.id);
    if (segments.length) {
      await MeetingSegmentRepo.bulkInsertSegments(meeting.id, segments);
    }

    // Create/replace default speakers based on unique indices
    const uniqueSpeakerIndices = Array.from(
      new Set(
        segments.map((s) => s.speakerIndex).filter((i) => Number.isFinite(i))
      )
    ).sort((a, b) => a - b);

    await MeetingSpeakerRepo.replaceSpeakersForMeeting(
      meeting.id,
      uniqueSpeakerIndices.map((idx) => ({
        speakerIndex: idx,
        label: `Speaker ${idx + 1}`,
      }))
    );

    // Update meeting transcript metadata
    await MeetingRepo.updateMeetingTranscript(meeting.id, fullTranscript);

    return { meetingId: meeting.id, transcript: fullTranscript, segments };
  },
  async getTranscriptForJoinCode({ joinCode, userId }: TranscribeArgs) {
    const meeting = await MeetingRepo.findMeetingByJoinCode(joinCode);
    if (!meeting) throw new NotFoundError("Meeting not found");

    const isMember = await MeetingRepo.isProjectMember(
      meeting.projectId,
      userId
    );
    if (!isMember)
      throw new ForbiddenError("You are not a member of this project");

    const [segmentsRows, speakerRows] = await Promise.all([
      MeetingSegmentRepo.getSegmentsForMeeting(meeting.id),
      MeetingSpeakerRepo.getSpeakersForMeeting(meeting.id),
    ]);

    const segments: SegmentDTO[] = segmentsRows.map((s) => ({
      startMs: s.startMs,
      endMs: s.endMs,
      speakerIndex: s.speakerIndex,
      text: s.text,
    }));

    // If there are no saved labels yet, fall back to "Speaker N"
    let speakers: SpeakerDTO[] = speakerRows.map((s) => ({
      speakerIndex: s.speakerIndex,
      label: s.label,
    }));

    if (!speakers.length && segments.length) {
      const uniqueIndexes = Array.from(
        new Set(segments.map((s) => s.speakerIndex))
      ).sort((a, b) => a - b);

      speakers = uniqueIndexes.map((i) => ({
        speakerIndex: i,
        label: `Speaker ${i + 1}`,
      }));
    }

    return {
      transcript: meeting.transcript ?? "",
      segments,
      speakers,
    };
  },

  async updateTranscriptForJoinCode(args: UpdateTranscriptArgs) {
    const { joinCode, userId, transcript, segments, speakers } = args;

    const meeting = await MeetingRepo.findMeetingByJoinCode(joinCode);
    if (!meeting) throw new NotFoundError("Meeting not found");

    const isMember = await MeetingRepo.isProjectMember(
      meeting.projectId,
      userId
    );
    if (!isMember)
      throw new ForbiddenError("You are not a member of this project");

    const cleanSegments: SegmentDTO[] = (segments || []).map((s) => ({
      startMs: Math.max(0, Number(s.startMs || 0)),
      endMs: Math.max(0, Number(s.endMs || 0)),
      speakerIndex: Number.isFinite(Number(s.speakerIndex))
        ? Number(s.speakerIndex)
        : 0,
      text: String(s.text ?? "").trim(),
    }));

    const cleanSpeakers: SpeakerDTO[] = (speakers || []).map((sp) => ({
      speakerIndex: Number(sp.speakerIndex),
      label: String(sp.label ?? "").trim() || `Speaker ${sp.speakerIndex + 1}`,
    }));

    // Replace segments + speakers, and update transcript text
    await MeetingSegmentRepo.deleteSegmentsForMeeting(meeting.id);
    if (cleanSegments.length) {
      await MeetingSegmentRepo.bulkInsertSegments(meeting.id, cleanSegments);
    }

    await MeetingSpeakerRepo.replaceSpeakersForMeeting(
      meeting.id,
      cleanSpeakers
    );

    await MeetingRepo.updateMeetingTranscript(meeting.id, transcript);

    // Return the fresh state
    return this.getTranscriptForJoinCode({ joinCode, userId });
  },
};
