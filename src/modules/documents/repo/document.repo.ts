import { prisma } from "@/lib/prisma";
import type { PropertyType } from "@/modules/documents/domain/types";
import { Prisma } from "@/generated/prisma";
import { isAuthDisabled } from "@/lib/auth";
import type { DocCollaboratorRole } from "@/generated/prisma";
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
//delete an option
async function txDeleteOptionSafe(args: {
  propertyId: string;
  optionId: string;
}) {
  const { propertyId, optionId } = args;

  return prisma.$transaction(async (tx) => {
    // ensure the option belongs to the property
    const exists = await tx.propertyOption.findFirst({
      where: { id: optionId, propertyId },
      select: { id: true },
    });
    if (!exists) {
      throw new Error("Option not found");
    }

    // 1) detach all document values pointing to this option
    await tx.documentPropertyValue.updateMany({
      where: { propertyId, optionId },
      data: { optionId: null },
    });

    // 2) delete the option
    try {
      await tx.propertyOption.delete({ where: { id: optionId } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2003"
      ) {
        // surface a stable error the service/route can map to 409
        throw Object.assign(new Error("Option is still referenced elsewhere"), {
          code: "OPTION_IN_USE",
        });
      }
      throw e;
    }
  });
}
async function updateOption(
  propertyId: string,
  optionId: string,
  data: { value?: string; color?: string | null; position?: number | null }
): Promise<RepoOptionOut> {
  // ensure option belongs to property
  const ok = await prisma.propertyOption.findFirst({
    where: { id: optionId, propertyId },
    select: { id: true },
  });
  if (!ok) throw new Error("Option not found");

  try {
    const updated = await prisma.propertyOption.update({
      where: { id: optionId },
      data: {
        ...(data.value !== undefined ? { value: data.value } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.position !== undefined ? { position: data.position } : {}),
      },
      select: { id: true, value: true, color: true, position: true },
    });

    return {
      id: updated.id,
      value: updated.value,
      color: updated.color ?? null,
      position: updated.position ?? null,
    };
  } catch (e) {
    // map Prisma unique constraint to stable code (for 409)
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw Object.assign(new Error("Duplicate option value"), {
        code: "P2002" as const,
      });
    }
    throw e;
  }
}
//function to read a property and its value.
async function readPropertiesWithValues(projectId: string, docId: string) {
  //ensure doc belongs to a project
  await assertDocInProject(docId, projectId);
  const links = await prisma.documentProperty.findMany({
    where: { documentId: docId },
    include: {
      property: {
        include: {
          options: {
            orderBy: [{ position: "asc" }, { value: "asc" }],
          },
        },
      },
    },
  });
  //fetching all values for the doc in one go
  const values = await prisma.documentPropertyValue.findMany({
    where: { documentId: docId },
    include: {
      option: true, //this is so select and status come back w option's colors and labels etc
    },
  });
  const valuesByProp = new Map(values.map((v) => [v.propertyId, v]));
  return links.map((link) => {
    const def = link.property;
    const val = valuesByProp.get(def.id);
    return {
      id: def.id,
      name: def.name,
      type: def.type,
      options: def.options.map((o) => ({
        id: o.id,
        value: o.value,
        color: o.color,
        position: o.position,
      })),
      value: val
        ? {
            valueString: val.valueString,
            valueNumber: val.valueNumber,
            valueBool: val.valueBool,
            valueDate: val.valueDate,
            valueJson: val.valueJson as string[] | null,
            optionId: val.optionId,
            option: val.option
              ? {
                  id: val.option.id,
                  value: val.option.value,
                  color: val.option.color,
                }
              : null,
          }
        : null,
    };
  });
}

export const DocumentRepo = {
  readPropertiesWithValues,
  updateOption,
  txDeleteOptionSafe,
  assertDocAndPropertySameProject,
  assertDocInProject,
  async findHeaderById(projectId: string, docId: string) {
    const doc = await prisma.document.findUnique({
      where: { id: docId, projectId },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!doc) return null;

    const properties = await readPropertiesWithValues(projectId, docId);

    return { ...doc, properties };
  },

  // get property definition by ID
  async getPropertyDefinition(projectId: string, propertyId: string) {
    return prisma.propertyDefinition.findFirst({
      where: { id: propertyId, projectId },
      include: { options: true },
    });
  },
  async txUpdatePropertyDefinition(args: {
    projectId: string;
    propertyId: string;
    updateBasics: { name: string; type: PropertyType };
    fromType: PropertyType;
    toType: PropertyType;
    keepField:
      | "optionId"
      | "valueString"
      | "valueNumber"
      | "valueBool"
      | "valueDate"
      | "valueJson";
  }) {
    const { propertyId, updateBasics, fromType, toType, keepField } = args;

    return prisma.$transaction(async (tx) => {
      // 1) update definition
      await tx.propertyDefinition.update({
        where: { id: propertyId },
        data: { name: updateBasics.name, type: updateBasics.type },
      });

      // 2) if type changed, normalize ALL values to new shape
      if (fromType !== toType) {
        await tx.documentPropertyValue.updateMany({
          where: { propertyId },
          data: {
            valueString: keepField === "valueString" ? undefined : null,
            valueNumber: keepField === "valueNumber" ? undefined : null,
            valueBool: keepField === "valueBool" ? undefined : null,
            valueDate: keepField === "valueDate" ? undefined : null,
            valueJson: keepField === "valueJson" ? undefined : Prisma.DbNull,
            optionId: keepField === "optionId" ? undefined : null,
          },
        });

        // 3) ALWAYS delete options on type change
        // (This will fail with FK Restrict if any TaskBoardColumn/Binding still references an option)
        //Reassignment flow (future): if you want to delete an option that’s used by TaskBoardColumn, add a query param ?reassignTo=<optionId> to move board columns & values before delete—happy to wire later.
        await tx.propertyOption.deleteMany({ where: { propertyId } });
      }

      // 4) return fresh definition (options will be [] after a type change)
      const withOptions = await tx.propertyDefinition.findUnique({
        where: { id: propertyId },
        include: {
          options: { orderBy: [{ position: "asc" }, { value: "asc" }] },
        },
      });

      return {
        id: withOptions!.id,
        name: withOptions!.name,
        type: withOptions!.type,
        options: (withOptions!.options ?? []).map((o) => ({
          id: o.id,
          value: o.value,
          color: o.color ?? null,
          position: o.position ?? null,
        })),
      };
    });
  },
  // Update title/description

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
  async txDeletePropertyFromDocAndMaybeGC(args: {
    projectId: string;
    docId: string;
    propertyId: string;
  }) {
    const { docId, propertyId } = args;
    return prisma.$transaction(async (tx) => {
      // remove value + link for THIS doc
      await tx.documentPropertyValue.deleteMany({
        where: { documentId: docId, propertyId },
      });
      await tx.documentProperty.delete({
        where: { documentId_propertyId: { documentId: docId, propertyId } },
      });

      // still used elsewhere?
      const remaining = await tx.documentProperty.count({
        where: { propertyId },
      });
      if (remaining > 0) return; // stop here (definition still in use)

      // GC: remove all values for this property across project (safety)
      await tx.documentPropertyValue.deleteMany({ where: { propertyId } });

      // delete options (may throw P2003 if referenced by TaskBoardColumn/Bindings)
      await tx.propertyOption.deleteMany({ where: { propertyId } });

      // delete definition
      await tx.propertyDefinition.delete({ where: { id: propertyId } });
    });
  },

  ////////////////////////////////////////////////////////////Doc Editor/////////////////////////////////////

  async canRead(projectId: string, docId: string, userId: string) {
    if (isAuthDisabled()) return true;
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId },
    });
    if (member) return true;
    const collab = await prisma.documentCollaborator.findFirst({
      where: { documentId: docId, userId },
    });
    return !!collab;
  },

  async canEdit(projectId: string, docId: string, userId: string) {
    if (isAuthDisabled()) return true;
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId },
    });
    if (member) return true;
    const collab = await prisma.documentCollaborator.findFirst({
      where: {
        documentId: docId,
        userId,
        role: { in: ["COMMENTER", "EDITOR"] },
      },
    });
    return !!collab;
  },
  async findContent(projectId: string, docId: string) {
    return prisma.document.findFirst({
      where: { id: docId, projectId },
      select: { id: true, content: true, updatedAt: true },
    });
  },
  async currentMeta(projectId: string, docId: string) {
    const row = await prisma.document.findFirst({
      where: { id: docId, projectId },
      select: { updatedAt: true },
    });
    if (!row) throw new Error("Not found");
    return row;
  },
  async updateContentIfCurrent(
    projectId: string,
    docId: string,
    content: Prisma.InputJsonValue,
    lastKnownUpdatedAt?: Date
  ) {
    if (lastKnownUpdatedAt) {
      const res = await prisma.document.updateMany({
        where: { id: docId, projectId, updatedAt: lastKnownUpdatedAt },
        data: { content },
      });
      return res.count > 0;
    }
    await prisma.document.update({
      where: { id: docId },
      data: { content },
    });
    return true;
  },
};
