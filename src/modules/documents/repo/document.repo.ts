import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

// keep undefined fields out of writes (but preserve explicit nulls/JsonNull)
function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

/** subset we allow callers to pass when writing a value row */
type ValueWrite = {
  valueString?: string | null;
  valueNumber?: number | null;
  valueBool?: boolean | null;
  valueDate?: Date | null;
  // IMPORTANT: for nullable JSON columns, use Prisma.NullableJsonNullValueInput
  // in addition to InputJsonValue
  valueJson?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  optionId?: string | null;
};

export const DocumentRepo = {
  // Include everything the service needs
  findHeaderById: (id: string) =>
    prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,

        // which properties are attached to this doc
        properties: {
          select: { property: { include: { options: true } } },
        },

        // typed values for those properties
        propertyValues: { include: { option: true } },

        content: true,
      },
    }),

  updateBasics: (
    id: string,
    data: { title?: string; description?: string | null }
  ) =>
    prisma.document.update({
      where: { id },
      data,
      select: { id: true, projectId: true },
    }),

  // definitions
  defsByNames: (projectId: string, names: string[]) =>
    prisma.propertyDefinition.findMany({
      where: { projectId, name: { in: names } },
      include: { options: true },
    }),

  createDef: (projectId: string, name: string, type: string) =>
    prisma.propertyDefinition.create({
      data: { projectId, name, type },
      include: { options: true },
    }),

  // links
  ensureLink: (documentId: string, propertyId: string) =>
    prisma.documentProperty.upsert({
      where: { documentId_propertyId: { documentId, propertyId } },
      create: { documentId, propertyId },
      update: {},
    }),

  linksForDoc: (documentId: string) =>
    prisma.documentProperty.findMany({ where: { documentId } }),

  deleteLink: (documentId: string, propertyId: string) =>
    prisma.documentProperty.delete({
      where: { documentId_propertyId: { documentId, propertyId } },
    }),

  // values
  upsertValue: (documentId: string, propertyId: string, data: ValueWrite) => {
    const cleaned = clean(data);
    return prisma.documentPropertyValue.upsert({
      where: { documentId_propertyId: { documentId, propertyId } },
      create: { documentId, propertyId, ...cleaned },
      update: cleaned,
    });
  },

  deleteValue: (documentId: string, propertyId: string) =>
    prisma.documentPropertyValue.delete({
      where: { documentId_propertyId: { documentId, propertyId } },
    }),
};
