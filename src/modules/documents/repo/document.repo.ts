import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
export type RepoPropertyOption = {
  id: string;
  value: string;
  color: string | null;
  position: number | null;
};
export type RepoPropertyDefinition = {
  id: string;
  name: string;

  type: string;
  options: RepoPropertyOption[];
};
export type RepoOptionIn = {
  id?: string;
  value: string;
  color?: string | null;
  position?: number | null;
};

export type RepoOptionOut = {
  id: string;
  value: string;
  color: string | null;
  position: number | null;
};
export type RepoDocumentHeader = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  properties: Array<{
    propertyId: string;
    property: RepoPropertyDefinition;
  }>;
};
export type DbValueUpdate = {
  valueString: string | null;
  valueNumber: number | null;
  valueBool: boolean | null;
  valueDate: Date | null;
  valueJson: string[] | null; // multi_select/person/file store string IDs
  optionId: string | null;
};
async function assertDocInProject(docId: string, projectId: string) {
  const doc = await prisma.document.findFirst({
    where: { id: docId, projectId },
    select: { id: true },
  });
  if (!doc) throw new Error("Document not found in project");
}
async function assertDocAndPropertySameProject(
  projectId: string,
  docId: string,
  propertyId: string
) {
  const [doc, prop] = await Promise.all([
    prisma.document.findFirst({
      where: { id: docId, projectId },
      select: { id: true },
    }),
    prisma.propertyDefinition.findFirst({
      where: { id: propertyId, projectId },
      select: { id: true },
    }),
  ]);

  if (!doc) throw new Error("Document not found");
  if (!prop) throw new Error("PropertyDefinition not found");
}

export const DocumentRepo = {
  assertDocInProject,
  async findHeaderById(
    projectId: string,
    docId: string
  ): Promise<RepoDocumentHeader | null> {
    const row = await prisma.document.findUnique({
      where: { id: docId, projectId },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        properties: {
          select: {
            propertyId: true,
            property: {
              select: {
                id: true,
                name: true,
                type: true,
                options: {
                  select: {
                    id: true,
                    value: true,
                    color: true,
                    position: true,
                  },
                  orderBy: [
                    { position: "asc" as const },
                    { value: "asc" as const },
                  ],
                },
              },
            },
          },
        },
      },
    });

    return row as unknown as RepoDocumentHeader | null;
  },
  async updateBasics(
    docId: string,
    data: { title?: string; description?: string | null }
  ): Promise<void> {
    await prisma.document.update({
      where: { id: docId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
      },
    });
  },
  async defsByNames(
    projectId: string,
    names: string[]
  ): Promise<Array<{ id: string; name: string; type: string }>> {
    if (names.length === 0) return [];
    return prisma.propertyDefinition.findMany({
      where: { projectId, name: { in: names } },
      select: { id: true, name: true, type: true },
    });
  },
  async createDef(
    projectId: string,
    name: string,
    type: string
  ): Promise<{ id: string; name: string; type: string }> {
    return prisma.propertyDefinition.create({
      data: { projectId, name, type },
      select: { id: true, name: true, type: true },
    });
  },
  async ensureLink(documentId: string, propertyId: string): Promise<void> {
    await prisma.documentProperty.upsert({
      where: { documentId_propertyId: { documentId, propertyId } },
      create: { documentId, propertyId },
      update: {}, // nothing to update
    });
  },
  async linksForDoc(documentId: string): Promise<
    Array<{
      documentId: string;
      propertyId: string;
      property: { id: string; name: string };
    }>
  > {
    return prisma.documentProperty.findMany({
      where: { documentId },
      select: {
        documentId: true,
        propertyId: true,
        property: { select: { id: true, name: true } },
      },
    });
  },
  async deleteValue(documentId: string, propertyId: string): Promise<void> {
    // deleteMany is safe if it might not exist
    await prisma.documentPropertyValue.deleteMany({
      where: { documentId, propertyId },
    });
  },

  async deleteLink(documentId: string, propertyId: string): Promise<void> {
    await prisma.documentProperty.delete({
      where: { documentId_propertyId: { documentId, propertyId } },
    });
  },
  async upsertValue(
    documentId: string,
    propertyId: string,
    value: DbValueUpdate
  ): Promise<void> {
    const data: Prisma.DocumentPropertyValueUpsertArgs["create"] = {
      documentId,
      propertyId,
      valueString: value.valueString,
      valueNumber: value.valueNumber,
      valueBool: value.valueBool,
      valueDate: value.valueDate,
      valueJson: (value.valueJson ?? null) as unknown as Prisma.InputJsonValue,
      optionId: value.optionId,
    };

    await prisma.documentPropertyValue.upsert({
      where: { documentId_propertyId: { documentId, propertyId } },
      create: data,
      update: {
        valueString: data.valueString,
        valueNumber: data.valueNumber,
        valueBool: data.valueBool,
        valueDate: data.valueDate,
        valueJson: data.valueJson,
        optionId: data.optionId,
      },
    });
  },
  async savePropertyOptions(
    projectId: string,
    docId: string,
    propertyId: string,
    options: RepoOptionIn[]
  ): Promise<RepoOptionOut[]> {
    await assertDocAndPropertySameProject(projectId, docId, propertyId);

    const normalized = options.map((o, idx) => ({
      ...o,
      position: o.position ?? idx,
      color: o.color ?? null,
    }));

    const touchedIds = await prisma.$transaction(async (tx) => {
      const touched = new Set<string>();

      // upsert by id if present; otherwise upsert by unique (propertyId, value)
      for (const o of normalized) {
        if (o.id) {
          const row = await tx.propertyOption.update({
            where: { id: o.id },
            data: {
              value: o.value,
              color: o.color,
              position: o.position,
            },
            select: { id: true },
          });
          touched.add(row.id);
        } else {
          const row = await tx.propertyOption.upsert({
            where: { propertyId_value: { propertyId, value: o.value } },
            create: {
              propertyId,
              value: o.value,
              color: o.color,
              position: o.position,
            },
            update: {
              color: o.color,
              position: o.position,
            },
            select: { id: true },
          });
          touched.add(row.id);
        }
      }

      // delete anything not touched
      await tx.propertyOption.deleteMany({
        where: {
          propertyId,
          id: { notIn: Array.from(touched) },
        },
      });

      return Array.from(touched);
    });

    // return fresh list
    const rows = await prisma.propertyOption.findMany({
      where: { propertyId },
      orderBy: [{ position: "asc" }, { value: "asc" }],
      select: { id: true, value: true, color: true, position: true },
    });

    return rows.map((r) => ({
      id: r.id,
      value: r.value,
      color: r.color ?? null,
      position: r.position ?? null,
    }));
  },
  /** Return options (guarding doc/property project match) */
  async readPropertyOptions(
    projectId: string,
    docId: string,
    propertyId: string
  ): Promise<RepoOptionOut[]> {
    await assertDocAndPropertySameProject(projectId, docId, propertyId);

    const rows = await prisma.propertyOption.findMany({
      where: { propertyId },
      orderBy: [{ position: "asc" }, { value: "asc" }],
      select: { id: true, value: true, color: true, position: true },
    });

    return rows.map((r) => ({
      id: r.id,
      value: r.value,
      color: r.color ?? null,
      position: r.position ?? null,
    }));
  },
};
