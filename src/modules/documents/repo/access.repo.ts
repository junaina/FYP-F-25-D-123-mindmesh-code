import { prisma } from "@/lib/prisma";
import type { DocCollaboratorRole } from "@/generated/prisma"; // or "@prisma/client"

export const accessRepo = {
  /** Is the user a member of the project? */
  async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    const m = await prisma.projectMember.findFirst({
      where: { projectId, userId },
      select: { userId: true },
    });
    return !!m;
  },

  /** Return the collaborator role on this doc (or null). */
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

  /** (Dev) ensure a user row exists – handy while auth is disabled. */
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

  /** (Dev) ensure dev user is a member of a project (optional). */
  async ensureProjectMembership(projectId: string, userId: string) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: {},
      create: { projectId, userId, role: "OWNER" },
    });
  },
};
