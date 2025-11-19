import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";

import { MeetingRepo } from "@/modules/meetings/repo/meeting.repo";
import { MeetingSegmentRepo } from "@/modules/meetings/repo/meetingSegment.repo";
import { MeetingSpeakerRepo } from "@/modules/meetings/repo/meetingSpeaker.repo";

type RouteContext = {
  params: Promise<{ joinCode: string }>; // Next.js 15 async params
};

//
// GET  /api/meet/[joinCode]/transcript
//
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    // --- auth via session cookie ---
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = await getMeFromSessionId(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { joinCode } = await context.params;

    const meeting = await MeetingRepo.findMeetingByJoinCode(joinCode);
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const isMember = await MeetingRepo.isProjectMember(
      meeting.projectId,
      me.id
    );
    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this project" },
        { status: 403 }
      );
    }

    const segments = await MeetingSegmentRepo.getSegmentsForMeeting(meeting.id);
    const speakers = await MeetingSpeakerRepo.getSpeakersForMeeting(meeting.id);

    return NextResponse.json(
      {
        transcript: meeting.transcript ?? "",
        segments: segments.map((s) => ({
          id: s.id,
          startMs: s.startMs,
          endMs: s.endMs,
          speakerIndex: s.speakerIndex,
          text: s.text,
        })),
        speakers: speakers.map((sp) => ({
          speakerIndex: sp.speakerIndex,
          label: sp.label,
        })),
        transcriptUpdatedAt: meeting.transcriptCreatedAt,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET transcript error", err);
    return NextResponse.json(
      { error: "Failed to load transcript" },
      { status: 500 }
    );
  }
}

type UpdateTranscriptBody = {
  transcript: string;
  segments: {
    startMs: number;
    endMs: number;
    speakerIndex: number;
    text: string;
  }[];
  speakers: {
    speakerIndex: number;
    label: string;
  }[];
};

//
// PUT /api/meet/[joinCode]/transcript
//
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = await getMeFromSessionId(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { joinCode } = await context.params;

    const meeting = await MeetingRepo.findMeetingByJoinCode(joinCode);
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const isMember = await MeetingRepo.isProjectMember(
      meeting.projectId,
      me.id
    );
    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this project" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as UpdateTranscriptBody;

    const transcript = body.transcript ?? "";
    const segments = Array.isArray(body.segments) ? body.segments : [];
    const speakers = Array.isArray(body.speakers) ? body.speakers : [];

    await MeetingSegmentRepo.deleteSegmentsForMeeting(meeting.id);
    if (segments.length) {
      await MeetingSegmentRepo.bulkInsertSegments(meeting.id, segments);
    }

    await MeetingSpeakerRepo.replaceSpeakersForMeeting(meeting.id, speakers);

    await MeetingRepo.updateMeetingTranscript(meeting.id, transcript);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("PUT transcript error", err);
    return NextResponse.json(
      { error: "Failed to update transcript" },
      { status: 500 }
    );
  }
}
