import { prisma } from "@/lib/prisma";

export const MeetingSegmentRepo = {
  async deleteSegmentsForMeeting(meetingId: string) {
    await prisma.meetingSegment.deleteMany({ where: { meetingId } });
  },

  async bulkInsertSegments(
    meetingId: string,
    segments: {
      startMs: number;
      endMs: number;
      speakerIndex: number;
      text: string;
    }[]
  ) {
    if (!segments.length) return;

    await prisma.meetingSegment.createMany({
      data: segments.map((s) => ({
        meetingId,
        startMs: s.startMs,
        endMs: s.endMs,
        speakerIndex: s.speakerIndex,
        text: s.text,
      })),
    });
  },

  async listForMeeting(meetingId: string) {
    return prisma.meetingSegment.findMany({
      where: { meetingId },
      orderBy: { startMs: "asc" },
    });
  },
};
