import { prisma } from "@/lib/prisma"

export class ThreadRepo {
  async create(
    discussionId: string,
    topic: string,
    description: string | undefined,
    userId: string
  ) {
    return prisma.thread.create({
      data: {
        discussionId,
        topic,
        description,
        createdById: userId,
      },
    });
  }

  listByDiscussion(discussionId: string) {
    return prisma.thread.findMany({
      where: { discussionId },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
