import { prisma } from "@/lib/prisma";

export class MessageRepo {
  async createMessage(
    threadId: string,
    senderId: string,
    body: string,
    bodyJson: any,
  ) {
    return prisma.message.create({
      data: {
        threadId,
        senderId,
        body,
        bodyJson,
      },
      include: {
        sender: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });
  }

  async listMessages(threadId: string) {
    return prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
        reactions: { select: { emoji: true, userId: true } },
      },
    });
  }

  async ensureProjectMember(projectId: string, userId: string) {
    return prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: {},
      create: { projectId, userId, role: "MEMBER" },
    });
  }

  async ensureThreadMember(threadId: string, userId: string) {
    return prisma.threadMember.upsert({
      where: { threadId_userId: { threadId, userId } },
      update: {},
      create: { threadId, userId },
    });
  }
}
