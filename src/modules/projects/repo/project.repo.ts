import { Args } from "@/generated/prisma/runtime/library";
import { prisma } from "@/lib/prisma";
import { ProjectRole } from "@/generated/prisma"; //FIXED

export type ProjectLite = {
  id: string;
  name: string;
  visibility: "PRIVATE" | "LINK" | "ORG";
};

export const projectRepo = {
  listForUser: async (userId: string): Promise<ProjectLite[]> => {
    const rows = await prisma.project.findMany({
      where: { members: { some: { userId } } },
      select: { id: true, name: true, visibility: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return rows;
  },

  createProjectWithOwner: async (args: {
    name: string;
    visibility: "PRIVATE" | "LINK" | "ORG";
    createdById: string;
  }): Promise<ProjectLite> => {
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: args.name,
          slug: null,
          visibility: args.visibility,
          createdById: args.createdById,
        },
        select: { id: true, name: true, visibility: true },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: args.createdById,
          role: "OWNER",
        },
      });

      return project;
    });
  },

  getMemberRole: async (
    projectId: string,
    userId: string
  ): Promise<"OWNER" | "ADMIN" | "MEMBER" | null> => {
    const row = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    });
    return row?.role ?? null;
  },

  rename: async (args: { projectId: string; name: string }) => {
    return prisma.project.update({
      where: { id: args.projectId },
      data: { name: args.name },
      select: { id: true, name: true, visibility: true },
    });
  },

  deleteById: async (projectId: string) => {
    return prisma.project.delete({
      where: { id: projectId },
      select: { id: true },
    });
  },

  getByIdForUser: async (projectId: string, userId: string) => {
    return prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [{ createdById: userId }, { members: { some: { userId } } }],
      },
      select: { id: true, name: true, slug: true, visibility: true },
    });
  },

  // -------------------------------
  // INVITE SYSTEM METHODS
  // -------------------------------
  createInvite: async (args: {
    projectId: string;
    email: string;
    role: ProjectRole;
    token: string;
    expiresAt?: Date | null;
  }) => {
    return prisma.invite.upsert({
      where: {
        projectId_email: {
          projectId: args.projectId,
          email: args.email,
        },
      },
      update: {
        role: args.role,
        token: args.token,
        expiresAt: args.expiresAt ?? null,
        acceptedAt: null,
      },
      create: {
        projectId: args.projectId,
        email: args.email,
        role: args.role,
        token: args.token,
        expiresAt: args.expiresAt ?? null,
      },
    });
  },

  getInviteByToken: async (token: string) => {
    return prisma.invite.findUnique({
      where: { token },
      include: { project: true },
    });
  },

  markInviteAccepted: async (inviteId: string) => {
    return prisma.invite.update({
      where: { id: inviteId },
      data: { acceptedAt: new Date() },
    });
  },

  addMemberToProject: async (args: {
    projectId: string;
    userId: string;
    role: ProjectRole;
  }) => {
    return prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: args.projectId,
          userId: args.userId,
        },
      },
      update: {
        role: args.role,
      },
      create: {
        projectId: args.projectId,
        userId: args.userId,
        role: args.role,
      },
    });
  },
};
