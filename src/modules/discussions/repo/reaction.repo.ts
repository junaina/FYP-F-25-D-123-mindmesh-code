import { prisma } from "@/lib/prisma";

export class ReactionRepo {
  async assertMessageScope(input: {
    projectId: string;
    threadId: string;
    messageId: string;
  }) {
    const msg = await prisma.message.findUnique({
      where: { id: input.messageId },
      select: {
        threadId: true,
        thread: { select: { discussion: { select: { projectId: true } } } },
      },
    });

    if (!msg) {
      const e: any = new Error("Message not found");
      e.status = 404;
      throw e;
    }

    if (
      msg.threadId !== input.threadId ||
      msg.thread.discussion.projectId !== input.projectId
    ) {
      const e: any = new Error("Message not in project/thread scope");
      e.status = 404;
      throw e;
    }
  }

  async toggleReaction(input: {
    messageId: string;
    userId: string;
    emoji: string;
  }) {
    const key = {
      messageId_userId_emoji: {
        messageId: input.messageId,
        userId: input.userId,
        emoji: input.emoji,
      },
    };

    const existing = await prisma.messageReaction.findUnique({ where: key });

    if (existing) {
      await prisma.messageReaction.delete({ where: key });
      return { toggled: "off" as const };
    }

    await prisma.messageReaction.create({
      data: {
        messageId: input.messageId,
        userId: input.userId,
        emoji: input.emoji,
      },
    });

    return { toggled: "on" as const };
  }
}
