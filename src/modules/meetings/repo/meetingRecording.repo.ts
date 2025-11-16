// meetingRecording.repo.ts
import { prisma } from "@/lib/prisma";

export const MeetingRecordingRepo = {
  async createRecording(args: {
    meetingId: string;
    egressId: string;
    s3Key: string;
  }) {
    const { meetingId, egressId, s3Key } = args;

    return prisma.meetingRecording.create({
      data: {
        meetingId,
        egressId,
        s3Key,
        status: "IN_PROGRESS", // enum value
      },
    });
  },

  async findLatestRecordingForMeeting(meetingId: string) {
    return prisma.meetingRecording.findFirst({
      where: { meetingId },
      orderBy: { createdAt: "desc" },
    });
  },

  async markRecordingCompleted(egressId: string) {
    const rec = await prisma.meetingRecording.findFirst({
      where: { egressId },
    });
    if (!rec) return null;

    return prisma.meetingRecording.update({
      where: { id: rec.id },
      data: { status: "COMPLETED" },
    });
  },

  async markRecordingFailed(egressId: string) {
    const rec = await prisma.meetingRecording.findFirst({
      where: { egressId },
    });
    if (!rec) return null;

    return prisma.meetingRecording.update({
      where: { id: rec.id },
      data: { status: "FAILED" },
    });
  },
  /**
   * Find a recording and include its meeting (for project membership checks).
   */
  async findByIdWithMeeting(id: string) {
    return prisma.meetingRecording.findUnique({
      where: { id },
      include: {
        meeting: true,
      },
    });
  },
  async findByS3KeyWithMeeting(s3Key: string) {
    return prisma.meetingRecording.findFirst({
      where: { s3Key },
      include: {
        meeting: true,
      },
    });
  },
};
