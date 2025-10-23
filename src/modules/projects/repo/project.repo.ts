import { Args } from "@/generated/prisma/runtime/library";
import { prisma } from "@/lib/prisma";
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
          slug: null, // explicitly null so uniqueness isn't involved
          visibility: args.visibility,
          createdById: args.createdById,
        },
        select: { id: true, name: true, visibility: true }, // removed slug
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
  //get member role
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
  //updating only the project name
  rename: async (args: { projectId: string; name: string }) => {
    const updated = await prisma.project.update({
      where: { id: args.projectId },
      data: { name: args.name },
      select: { id: true, name: true, visibility: true },
    });
    return updated;
  },
  deleteById: async (projectId: string): Promise<{ id: string }> => {
    const deleted = await prisma.project.delete({
      where: { id: projectId },
      select: { id: true },
    });
    return deleted;
  },
  //helper to check memebership/ownership
  getByIdForUser: async (projectId: string, userId: string) => {
    return prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [{ createdById: userId }, { members: { some: { userId } } }],
      },
      select: { id: true, name: true, slug: true, visibility: true },
    });
  },
};
