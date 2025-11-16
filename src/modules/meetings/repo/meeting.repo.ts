import { prisma } from "@/lib/prisma";

export type MeetingRow = {
  id: string;
  projectId: string;
  createdById: string;
  title: string;
  joinCode: string;
  livekitRoomName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export const MeetingRepo = {
  async isProjectMember(projectId: string, userId: string) {
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId },
      select: { projectId: true },
    });
    return !!member;
  },

  async createMeeting(args: {
    id: string;
    projectId: string;
    createdById: string;
    title: string;
    joinCode: string;
    livekitRoomName: string;
  }): Promise<MeetingRow> {
    const { id, projectId, createdById, title, joinCode, livekitRoomName } =
      args;

    const row = await prisma.meeting.create({
      data: {
        id,
        projectId,
        createdById,
        title,
        joinCode,
        livekitRoomName,
        status: "SCHEDULED",
      },
    });

    return row;
  },

  async findMeetingByJoinCode(joinCode: string) {
    return prisma.meeting.findUnique({
      where: { joinCode },
    });
  },
  async findMeetingWithMembersByJoinCode(joinCode: string) {
    return prisma.meeting.findUnique({
      where: { joinCode },
      include: {
        project: {
          select: {
            id: true,
            createdById: true,
            members: {
              select: {
                userId: true,
                role: true,
              },
            },
          },
        },
      },
    });
  },
};
