// src/modules/meet/services/meeting.service.ts

import { randomUUID } from "crypto";
import { buildLivekitRoomName, createJoinToken } from "@/lib/livekit";
import { generateMeetingJoinCode } from "@/lib/meetingCode";
import { MeetingRepo } from "../repo/meeting.repo";
type CreateJoinTokenArgs = {
  joinCode: string;
  userId: string; // authenticated User.id
  displayName: string; // "First Last"
};
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
  // src/modules/meetings/services/meeting.service.ts

  async createJoinTokenForJoinCode({
    joinCode,
    userId,
    displayName,
  }: CreateJoinTokenArgs) {
    const meeting = await MeetingRepo.findMeetingWithMembersByJoinCode(
      joinCode
    );

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    const { project } = meeting;

    const isOwner = project.createdById === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new Error("You’re not a member of this project");
    }

    // Generate LiveKit token tied to this user
    const token = await createJoinToken({
      roomName: meeting.livekitRoomName,
      identity: userId,
      name: displayName,
    });

    return {
      token,
      roomName: meeting.livekitRoomName,
      meeting: {
        id: meeting.id,
        title: meeting.title,
      },
    };
  },
};
