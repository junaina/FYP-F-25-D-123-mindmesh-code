import { prisma } from "@/lib/prisma";

export type CreateFileRow = {
  id: string;
  projectId: string;
  uploaderId: string;
  filename: string;
  mime: string;
  size: number;
  storageKey: string;
};

export class FileRepo {
  async isProjectMember(projectId: string, userId: string) {
    const row = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { userId: true },
    });
    return Boolean(row);
  }

  async createManyFiles(rows: CreateFileRow[]) {
    // we generate ids in service, so createMany is fine
    await prisma.file.createMany({ data: rows, skipDuplicates: false });
  }

  async findByIds(projectId: string, ids: string[]) {
    return prisma.file.findMany({
      where: { projectId, id: { in: ids } },
      select: { id: true, filename: true, storageKey: true, projectId: true },
    });
  }

  async findById(fileId: string) {
    return prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        filename: true,
        storageKey: true,
        projectId: true,
        uploaderId: true,
      },
    });
  }
}
