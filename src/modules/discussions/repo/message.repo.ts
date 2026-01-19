import { prisma } from "@/lib/prisma";

export class MessageRepo {
  async createMessage(
    threadId: string,
    senderId: string,
    body: string,
    bodyJson: any,
    mentionUserIds?: string[],
    attachmentFileIds?: string[],
  ) {
    const mentionUserIdsList = Array.from(new Set(mentionUserIds ?? []));
    const fileIds = Array.from(new Set(attachmentFileIds ?? []));

    return prisma.message.create({
      data: {
        threadId,
        senderId,
        body,
        bodyJson,
        mentions: mentionUserIdsList.length
          ? {
              createMany: {
                data: mentionUserIdsList.map((userId) => ({ userId })),
                skipDuplicates: true,
              },
            }
          : undefined,
        attachments: fileIds.length
          ? {
              createMany: {
                data: fileIds.map((fileId) => ({ fileId })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      include: {
        sender: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        reactions: { select: { emoji: true, userId: true } },
        attachments: {
          include: { File: { select: { id: true, filename: true } } },
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
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        reactions: { select: { emoji: true, userId: true } },
        attachments: {
          include: { File: { select: { id: true, filename: true } } },
        },
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
