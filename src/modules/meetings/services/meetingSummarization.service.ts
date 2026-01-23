import { MeetingRepo } from "@/modules/meetings/repo/meeting.repo";
import { summarizeViaPythonSummarizer, type SummarizerFormat } from "@/modules/meetings/client/summarizer.client";

export class NotFoundError extends Error {
  override name = "NotFoundError";
}
export class ForbiddenError extends Error {
  override name = "ForbiddenError";
}
export class TranscriptMissingError extends Error {
  override name = "TranscriptMissingError";
}

export async function summarizeMeetingForJoinCode(args: {
  joinCode: string;
  userId: string;
  options?: { format?: SummarizerFormat; maxTokens?: number };
}) {
  const meeting = await MeetingRepo.findMeetingByJoinCode(args.joinCode);
  if (!meeting) throw new NotFoundError("Meeting not found");

  const isMember = await MeetingRepo.isProjectMember(meeting.projectId, args.userId);
  if (!isMember) throw new ForbiddenError("You are not a member of this project");

  const transcript = (meeting.transcript ?? "").trim();
  if (!transcript) {
    throw new TranscriptMissingError(
      "No transcript found for this meeting. Transcribe the meeting first."
    );
  }

  return summarizeViaPythonSummarizer({
    meetingId: meeting.id,
    transcript,
    options: args.options,
  });
}
