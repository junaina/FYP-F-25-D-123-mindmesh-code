// src/modules/meetings/services/meeting.service.ts

import { randomUUID } from "crypto";
import { buildLivekitRoomName, createJoinToken } from "@/lib/livekit";
import { generateMeetingJoinCode } from "@/lib/meetingCode";
import { MeetingRepo } from "../repo/meeting.repo";
import { MeetingRecordingRepo } from "../repo/meetingRecording.repo";
import { startRoomRecording, stopRoomRecording } from "@/lib/livekit";
export const MeetingService = {
  /**
   * Create a meeting in a project.
   * - checks project membership
   * - generates meeting id, joinCode, livekitRoomName
   * - persists via MeetingRepo
   */
  async createProjectMeeting(args: {
    projectId: string;
    userId: string;
    title?: string;
  }) {
    const { projectId, userId, title } = args;

    const isMember = await MeetingRepo.isProjectMember(projectId, userId);
    if (!isMember) {
      throw new Error("Forbidden");
    }

    const meetingId = randomUUID();
    const livekitRoomName = buildLivekitRoomName(meetingId);
    const joinCode = generateMeetingJoinCode();

    const meeting = await MeetingRepo.createMeeting({
      id: meetingId,
      projectId,
      createdById: userId,
      title: title?.trim() || "Untitled meeting",
      joinCode,
      livekitRoomName,
    });

    return meeting;
  },

  /**
   * Create a LiveKit join token from a joinCode.
   * - requires a logged-in user
   * - checks that user is a member of the meeting’s project
   */
  async createJoinTokenForJoinCode(args: {
    joinCode: string;
    userId?: string; // optional in type, but required at runtime
    displayName?: string;
  }) {
    const { joinCode, userId, displayName } = args;

    const meeting = await MeetingRepo.findMeetingByJoinCode(joinCode);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    if (!userId) {
      // we decided to drop guest access
      throw new Error("Unauthorized");
    }

    const isMember = await MeetingRepo.isProjectMember(
      meeting.projectId,
      userId
    );
    if (!isMember) {
      throw new Error("Forbidden");
    }

    const identity = userId;
    const name = displayName ?? "Member";

    // you could also just use meeting.livekitRoomName here
    const roomName =
      meeting.livekitRoomName || buildLivekitRoomName(meeting.id);

    const token = await createJoinToken({
      roomName,
      identity,
      name,
    });

    return {
      token,
      roomName,
      meeting: {
        id: meeting.id,
        title: meeting.title,
      },
    };
  },
  /**
   * Start a LiveKit room recording for a meeting, by joinCode.
   * Only the project owner or members can start recording.
   */
  async startRecordingForJoinCode(args: { joinCode: string; userId: string }) {
    const { joinCode, userId } = args;

    const meeting = await MeetingRepo.findMeetingWithMembersByJoinCode(
      joinCode
    );

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    // Check project membership
    const isOwner = meeting.project.createdById === userId;
    const isMember = meeting.project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new Error(
        "You are not allowed to start recording for this meeting"
      );
    }

    if (meeting.status === "ENDED") {
      throw new Error("Meeting has already ended");
    }

    // Kick off LiveKit egress → S3
    const { egressId, s3Key } = await startRoomRecording({
      roomName: meeting.livekitRoomName,
      meetingId: meeting.id,
    });

    // Persist recording row
    const recording = await MeetingRecordingRepo.createRecording({
      meetingId: meeting.id,
      egressId,
      s3Key,
    });

    // Mark meeting as LIVE and having a recording
    await MeetingRepo.updateMeetingStatus(meeting.id, "LIVE");
    await MeetingRepo.setMeetingHasRecording(meeting.id, true);

    return {
      meetingId: meeting.id,
      egressId,
      s3Key,
      recordingId: recording.id,
    };
  },

  /**
   * Stop the most recent recording for a meeting, by joinCode.
   * Only owner/members can stop recording.
   */
  async stopRecordingForJoinCode(args: { joinCode: string; userId: string }) {
    const { joinCode, userId } = args;

    const meeting = await MeetingRepo.findMeetingWithMembersByJoinCode(
      joinCode
    );

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    const isOwner = meeting.project.createdById === userId;
    const isMember = meeting.project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new Error("You are not allowed to stop recording for this meeting");
    }

    const latest = await MeetingRecordingRepo.findLatestRecordingForMeeting(
      meeting.id
    );

    if (!latest) {
      throw new Error("No recording found for this meeting");
    }

    try {
      // Stop egress job in LiveKit
      const info = await stopRoomRecording(latest.egressId);

      // You *could* inspect `info.status` here – for now assume success
      await MeetingRecordingRepo.markRecordingCompleted(latest.egressId);
      await MeetingRepo.updateMeetingStatus(meeting.id, "ENDED");

      return {
        meetingId: meeting.id,
        egressId: latest.egressId,
        status: "COMPLETED",
        info,
      };
    } catch (err) {
      await MeetingRecordingRepo.markRecordingFailed(latest.egressId);
      throw err;
    }
  },
};
