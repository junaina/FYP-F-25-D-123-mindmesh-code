import { prisma } from "@/lib/prisma";
import type { DocCollaboratorRole } from "@/generated/prisma"; // or "@prisma/client"

export const accessRepo = {
  async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    const m = await prisma.projectMember.findFirst({
      where: { projectId, userId },
      select: { userId: true },
    });
    return !!m;
  },

  async getDocCollaboratorRole(
    docId: string,
    userId: string
  ): Promise<DocCollaboratorRole | null> {
    const row = await prisma.documentCollaborator.findFirst({
      where: { documentId: docId, userId },
      select: { role: true },
    });
    return row?.role ?? null;
  },

  async upsertDevUser(id: string, email: string) {
    await prisma.user.upsert({
      where: { id },
      update: {},
      create: {
        id,
        firstName: "Dev",
        lastName: "User",
        email,
        passwordHash: "dev",
      },
    });
  },

  async ensureProjectMembership(projectId: string, userId: string) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: {},
      create: { projectId, userId, role: "OWNER" },
    });
  },
};
