import { prisma } from "@/lib/prisma";

export class ProjectMemberRepo {
  async searchMembers(projectId: string, query: string) {
    const q = query.trim();

    return prisma.projectMember.findMany({
      where: {
        projectId,
        ...(q
          ? {
              OR: [
                { user: { firstName: { contains: q, mode: "insensitive" } } },
                { user: { lastName: { contains: q, mode: "insensitive" } } },
                { user: { email: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
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
      take: 8,
      orderBy: { joinedAt: "asc" },
    });
  }
}
