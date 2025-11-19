// src/modules/meetings/repo/meetingSpeaker.repo.ts
import { prisma } from "@/lib/prisma";

export const MeetingSpeakerRepo = {
  async getSpeakersForMeeting(meetingId: string) {
    return prisma.meetingSpeaker.findMany({
      where: { meetingId },
      orderBy: { speakerIndex: "asc" },
    });
  },

  // simplest strategy: replace everything on each save
  async replaceSpeakersForMeeting(
    meetingId: string,
    speakers: { speakerIndex: number; label: string }[]
  ) {
    await prisma.meetingSpeaker.deleteMany({
      where: { meetingId },
    });

    if (!speakers.length) return;

    await prisma.meetingSpeaker.createMany({
      data: speakers.map((s) => ({
        meetingId,
        speakerIndex: s.speakerIndex,
        label: s.label,
      })),
    });
  },
};
