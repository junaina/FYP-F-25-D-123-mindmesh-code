import { prisma } from "@/lib/prisma";
export const TaskboardRepo = {
  async listByProject(projectId: string) {
    return prisma.taskBoard.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        hostDocumentId: true,
        bindings: { select: { statusPropertyId: true } },
      },
    });
  },
  async getSnapshot(projectId: string, taskBoardId: string) {
    return prisma.taskBoard.findFirst({
      where: { id: taskBoardId, projectId },
      include: {
        bindings: true,
        columns: { include: { option: true }, orderBy: { position: "asc" } },
        items: {
          include: {
            column: true,
            document: { select: { id: true, title: true, description: true } },
          },
        },
      },
    });
  },
};
