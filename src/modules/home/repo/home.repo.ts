import { prisma } from "@/lib/prisma";

export const homeRepo = {
  async getProjectsForUser(userId: string) {
    return prisma.project.findMany({
      where: {
        OR: [{ createdById: userId }, { members: { some: { userId } } }],
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, slug: true, updatedAt: true },
      take: 24,
    });
  },

  async getRecentDocsForUser(userId: string) {
    return prisma.document.findMany({
      where: {
        isArchived: false,
        project: {
          OR: [{ createdById: userId }, { members: { some: { userId } } }],
        },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        project: { select: { id: true, name: true, slug: true } },
      },
      take: 20,
    });
  },
};
