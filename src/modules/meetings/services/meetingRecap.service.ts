// src/modules/meetings/services/meetingRecap.service.ts

import { MeetingRepo } from "@/modules/meetings/repo/meeting.repo";
import { MeetingRecordingRepo } from "@/modules/meetings/repo/meetingRecording.repo";

export type MeetingStatus = "SCHEDULED" | "LIVE" | "ENDED";
export type MeetingRecordingStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED";

export type MeetingRecapMeeting = {
  id: string;
  projectId: string;
  createdById: string;
  title: string;
  joinCode: string;
  livekitRoomName: string;
  status: MeetingStatus;
  hasRecording: boolean;
  hasTranscript: boolean;
  transcriptCreatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MeetingRecordingSummaryRecord = {
  id: string;
  meetingId: string;
  egressId: string;
  s3Key: string;
  status: MeetingRecordingStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type MeetingRecap = {
  meeting: MeetingRecapMeeting;
  latestRecording: MeetingRecordingSummaryRecord | null;
};

type GetMeetingRecapArgs = {
  joinCode: string;
  userId: string;
};

export const MeetingRecapService = {
  /**
   * Returns a lightweight recap object for the meeting identified by joinCode:
   * - meeting core metadata
   * - latest MeetingRecording row (if any)
   *
   * Ensures the user is a member of the meeting's project.
   */
  async getMeetingRecapForJoinCode(
    args: GetMeetingRecapArgs
  ): Promise<MeetingRecap> {
    const { joinCode, userId } = args;

    // 1) Look up meeting by joinCode
    const meeting = await MeetingRepo.findMeetingByJoinCode(joinCode);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    // 2) Check project membership
    const isMember = await MeetingRepo.isProjectMember(
      meeting.projectId,
      userId
    );

    if (!isMember) {
      throw new Error("You are not allowed to view this meeting");
    }

    // 3) Fetch latest recording, if any
    const latest = await MeetingRecordingRepo.findLatestRecordingForMeeting(
      meeting.id
    );

    const meetingDto: MeetingRecapMeeting = {
      id: meeting.id,
      projectId: meeting.projectId,
      createdById: meeting.createdById,
      title: meeting.title,
      joinCode: meeting.joinCode,
      livekitRoomName: meeting.livekitRoomName,
      status: meeting.status as MeetingStatus,
      hasRecording: meeting.hasRecording,
      hasTranscript: meeting.hasTranscript,
      transcriptCreatedAt: meeting.transcriptCreatedAt,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    };

    const latestRecordingDto: MeetingRecordingSummaryRecord | null = latest
      ? {
          id: latest.id,
          meetingId: latest.meetingId,
          egressId: latest.egressId,
          s3Key: latest.s3Key,
          status: latest.status as MeetingRecordingStatus,
          createdAt: latest.createdAt,
          updatedAt: latest.updatedAt,
        }
      : null;

    return {
      meeting: meetingDto,
      latestRecording: latestRecordingDto,
    };
  },
};
