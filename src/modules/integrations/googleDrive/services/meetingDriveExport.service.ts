// src/modules/meetings/services/meetingDriveExport.service.ts
import { MeetingRepo } from "@/modules/meetings/repo/meeting.repo";
import { MeetingSegmentRepo } from "@/modules/meetings/repo/meetingSegment.repo";
import { MeetingSpeakerRepo } from "@/modules/meetings/repo/meetingSpeaker.repo";
import { GoogleDriveOauthRepo } from "@/modules/integrations/googleDrive/repo/googleDriveOauth.repo";
import { buildMeetingTranscriptPdf } from "@/lib/google/buildMeetingTranscriptPdf";
import { uploadTranscriptToDrive } from "@/lib/google/uploadTranscriptToDrive";

export type DriveExportResult =
  | { kind: "needs_oauth"; redirectUrl: string }
  | { kind: "uploaded"; driveFileUrl?: string | null };

export const MeetingDriveExportService = {
  async startExportToDrive(args: {
    userId: string;
    joinCode: string;
  }): Promise<DriveExportResult> {
    const { userId, joinCode } = args;

    const meeting = await MeetingRepo.findMeetingByJoinCode(joinCode);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    const isMember = await MeetingRepo.isProjectMember(
      meeting.projectId,
      userId
    );
    if (!isMember) {
      throw new Error("You are not a member of this project");
    }

    const googleIdentity = await GoogleDriveOauthRepo.findForUser(userId);

    // 1) No refresh token → must send user through Google OAuth
    if (!googleIdentity?.refreshToken) {
      const statePayload = {
        action: "save_meeting_transcript_to_drive" as const,
        joinCode,
      };
      const state = encodeURIComponent(JSON.stringify(statePayload));

      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: process.env.GOOGLE_DRIVE_REDIRECT_URI!,
        response_type: "code",
        scope: [
          "openid",
          "email",
          "https://www.googleapis.com/auth/drive.file",
        ].join(" "),
        access_type: "offline",
        prompt: "consent",
        state,
      });

      const redirectUrl =
        "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString();

      return { kind: "needs_oauth", redirectUrl };
    }

    // 2) We have a refresh token → generate and upload PDF
    const [segments, speakers] = await Promise.all([
      MeetingSegmentRepo.getSegmentsForMeeting(meeting.id),
      MeetingSpeakerRepo.getSpeakersForMeeting(meeting.id),
    ]);

    const pdfBuffer = await buildMeetingTranscriptPdf({
      meeting,
      segments,
      speakers,
    });

    const driveFile = await uploadTranscriptToDrive({
      refreshToken: googleIdentity.refreshToken!,
      fileName: `${meeting.title || "Meeting"} - Transcript.pdf`,
      pdfBuffer,
    });

    return { kind: "uploaded", driveFileUrl: driveFile.webViewLink ?? null };
  },
};
