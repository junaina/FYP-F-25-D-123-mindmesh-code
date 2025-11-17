import { prisma } from "@/lib/prisma"

export class DiscussionRepo {
  async findByProjectId(projectId: string) {
    return prisma.discussion.findUnique({
      where: { projectId },
    });
  }

  async createForProject(projectId: string) {
    return prisma.discussion.create({
      data: { projectId },
    });
  }
}
