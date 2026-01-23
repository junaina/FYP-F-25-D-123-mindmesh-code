// src/modules/integrations/googleDrive/services/meetingSummaryDriveExport.service.ts
import crypto from "crypto";
import type { MeetingSegment, MeetingSpeaker } from "@/generated/prisma";
import { MeetingRepo } from "@/modules/meetings/repo/meeting.repo";
import { GoogleDriveOauthRepo } from "@/modules/integrations/googleDrive/repo/googleDriveOauth.repo";

// Reuse the same PDF builder + upload util used by transcript export
import { buildMeetingTranscriptPdf } from "@/lib/google/buildMeetingTranscriptPdf";
import { uploadTranscriptToDrive } from "@/lib/google/uploadTranscriptToDrive";

export type DriveExportResult =
  | { kind: "needs_oauth"; redirectUrl: string }
  | { kind: "uploaded"; driveFileUrl?: string | null };

export const MeetingSummaryDriveExportService = {
  async startExportToDrive(args: {
    userId: string;
    joinCode: string;
    summary: string;
    actionItems: string[];
  }): Promise<DriveExportResult> {
    const { userId, joinCode, summary, actionItems } = args;

    const meeting = await MeetingRepo.findMeetingByJoinCode(joinCode);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    const isMember = await MeetingRepo.isProjectMember(
      meeting.projectId,
      userId,
    );
    if (!isMember) {
      throw new Error("You are not a member of this project");
    }

    const googleIdentity = await GoogleDriveOauthRepo.findForUser(userId);

    // 1) No refresh token → send user through Google OAuth
    if (!googleIdentity?.refreshToken) {
      const statePayload = {
        action: "save_meeting_summary_to_drive" as const,
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

    // 2) We have refresh token → build a simple "summary doc" PDF and upload
    const safeSummary = (summary ?? "").trim();
    const safeItems = Array.isArray(actionItems) ? actionItems : [];

    const sections: string[] = [];
    sections.push("AI SUMMARY\n" + (safeSummary || "(empty)"));

    if (safeItems.length) {
      sections.push(
        "ACTION ITEMS\n" +
          safeItems.map((x, i) => `${i + 1}. ${String(x)}`).join("\n"),
      );
    }

    // Reuse transcript PDF generator by providing “fake” segments/speakers in-memory.
    const segments: MeetingSegment[] = [
      {
        id: crypto.randomUUID(),
        meetingId: meeting.id,
        startMs: 0,
        endMs: 0,
        speakerIndex: 0,
        text: sections.join("\n\n"),
      },
    ];

    const speakers: MeetingSpeaker[] = [
      {
        id: crypto.randomUUID(),
        meetingId: meeting.id,
        speakerIndex: 0,
        label: "Mindmesh AI",
      },
    ];

    const pdfBuffer = await buildMeetingTranscriptPdf({
      meeting,
      segments,
      speakers,
    });

    const driveFile = await uploadTranscriptToDrive({
      refreshToken: googleIdentity.refreshToken!,
      fileName: `${meeting.title || "Meeting"} - Summary.pdf`,
      pdfBuffer,
    });

    return { kind: "uploaded", driveFileUrl: driveFile.webViewLink ?? null };
  },
};
