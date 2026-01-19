import { MeetingRepo } from "@/modules/meetings/repo/meeting.repo";
import { MeetingRecordingRepo } from "@/modules/meetings/repo/meetingRecording.repo";

// No Prisma import – just use string unions.
export type MeetingRecordingStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED";

export type MeetingRecordingRecord = {
  id: string;
  meetingId: string;
  egressId: string;
  s3Key: string;
  status: MeetingRecordingStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class NotFoundError extends Error {
  override name = "NotFoundError";
}

export class ForbiddenError extends Error {
  override name = "ForbiddenError";
}

type GetCurrentRecordingArgs = {
  joinCode: string;
  userId: string;
};

export const MeetingRecordingStatusService = {
  /**
   * Returns the latest MeetingRecording row for the meeting identified by joinCode,
   * or null if there is no recording yet.
   *
   * Ensures the user is a member of the project.
   */
  async getCurrentRecordingForJoinCode(
    args: GetCurrentRecordingArgs
  ): Promise<MeetingRecordingRecord | null> {
    const { joinCode, userId } = args;

    // 1) Look up the meeting by joinCode
    const meeting = await MeetingRepo.findMeetingByJoinCode(joinCode);
    if (!meeting) {
      throw new NotFoundError("Meeting not found for joinCode");
    }

    //  2) Ensure the user is a member of the meeting's project
    const isMember = await MeetingRepo.isProjectMember(
      meeting.projectId,
      userId
    );

    if (!isMember) {
      throw new ForbiddenError("You are not a member of this project");
    }

    //  3) Fetch the latest recording row for this meeting
    const latest = await MeetingRecordingRepo.findLatestRecordingForMeeting(
      meeting.id
    );

    if (!latest) {
      return null;
    }

    //  4) Map to a simple DTO
    const record: MeetingRecordingRecord = {
      id: latest.id,
      meetingId: latest.meetingId,
      egressId: latest.egressId,
      s3Key: latest.s3Key,
      status: latest.status as MeetingRecordingStatus,
      createdAt: latest.createdAt,
      updatedAt: latest.updatedAt,
    };

    return record;
  },
};
