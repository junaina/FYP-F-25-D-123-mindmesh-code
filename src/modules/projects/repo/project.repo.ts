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
};
