import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma"; // runtime import

// strip undefined so Prisma doesn't see keys we didn't set
function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

export const DocumentRepo = {
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
        // links -> we only need the PropertyDefinition (with options)
        properties: { select: { property: { include: { options: true } } } },
        // raw values for each linked property
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

  // IMPORTANT: don't wrap in Partial<...>. Make each field optional instead.
  upsertValue: (
    documentId: string,
    propertyId: string,
    data: {
      valueString?: string | null;
      valueNumber?: number | null;
      valueBool?: boolean | null;
      valueDate?: Date | null;
      // Prisma JSON must be InputJsonValue (or omitted). If you want to clear JSON, pass Prisma.DbNull/JsonNull in the mapper.
      valueJson?: Prisma.InputJsonValue;
      optionId?: string | null;
    }
  ) => {
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
