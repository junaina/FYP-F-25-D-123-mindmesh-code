import { DocumentRepo } from "../repo/document.repo";
import type { DocContent } from "../domain/content.types";
import { isAuthDisabled } from "@/lib/auth";
import { accessRepo } from "@/modules/documents/repo/access.repo";
import { Prisma } from "@/generated/prisma";
import type {
  PatchDocHeaderDto,
  PatchPropertyDefDto,
  PropertyValueDto,
  CreatePropertyBodyDto,
  PatchPropertyOptionDto,
} from "@/modules/documents/dto/doc.dto";
import {
  PROPERTY_TYPES,
  type PropertyType,
} from "@/modules/documents/domain/types";

//wen updating a property definition
type UpdatePropertyArgs = {
  projectId: string;
  docId: string;
  propertyId: string;
  body: PatchPropertyDefDto;
};

const TARGET_FIELD: Record<
  PropertyType,
  | "optionId"
  | "valueString"
  | "valueNumber"
  | "valueBool"
  | "valueDate"
  | "valueJson"
> = {
  text: "valueString",
  number: "valueNumber",
  email: "valueString",
  url: "valueString",
  checkbox: "valueBool",
  date_time: "valueDate",
  select: "optionId",
  status: "optionId",
  multi_select: "valueJson",
  person: "valueJson",
  file: "valueJson",
};

const MAX_CONTENT_BYTES = 2_000_000;
const toInputJson = (c: DocContent): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(c)) as Prisma.InputJsonValue;

type CreatePropertyArgs = {
  projectId: string;
  docId: string;
  body: CreatePropertyBodyDto;
};

type RepoPropertyOption = {
  id: string;
  value: string;
  color: string | null;
  position: number | null;
};

type RepoPropertyDefinition = {
  id: string;
  name: string;
  type: string; 
  options: RepoPropertyOption[];
};

type RepoDocumentHeader = {
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

type DbValueUpdate = {
  valueString: string | null;
  valueNumber: number | null;
  valueBool: boolean | null;
  valueDate: Date | null;
  valueJson: string[] | null; 
  optionId: string | null; 
};
export type SaveOptionInput = {
  id?: string;
  value: string;
  color?: string | null;
  position?: number | null;
};

export type OptionOut = {
  id: string;
  value: string;
  color: string | null;
  position: number | null;
};
/////////////////////////////Editor Types///////////////////////////////////////
export type GetContentResult = {
  id: string;
  content: DocContent;
  updatedAt: Date;
};

export type UpdateContentArgs = {
  projectId: string;
  docId: string;
  userId: string;
  content: DocContent; 
  lastKnownUpdatedAt?: Date; 
};

export type UpdateContentResult =
  | { mutated: true; updatedAt: Date }
  | { mutated: false; currentUpdatedAt: Date }; 
////////////////////////////////////////////////////////////////////////////////
function dbValueToDto(
  propType: PropertyType,
  db: {
    valueString: string | null;
    valueNumber: number | null;
    valueBool: boolean | null;
    valueDate: Date | string | null;
    valueJson: unknown | null;
    optionId: string | null;
  } | null
): PropertyValueDto | null {
  if (!db) return null;

  switch (propType) {
    case "text":
      return { type: "text", value: db.valueString ?? null };
    case "number":
      return { type: "number", value: db.valueNumber ?? null };
    case "email":
      return { type: "email", value: db.valueString ?? null };
    case "url":
      return { type: "url", value: (db.valueString ?? null) as string | null };
    case "checkbox":
      return { type: "checkbox", value: !!db.valueBool };
    case "date_time":
      return {
        type: "date_time",
        value: db.valueDate ? new Date(db.valueDate).toISOString() : null,
      };
    case "select":
      return { type: "select", value: db.optionId ?? null };
    case "status":
      return { type: "status", value: db.optionId ?? null };
    case "multi_select": {
      const arr = Array.isArray(db.valueJson) ? (db.valueJson as string[]) : [];
      return { type: "multi_select", value: arr };
    }
    case "person": {
      const arr = Array.isArray(db.valueJson) ? (db.valueJson as string[]) : [];
      return { type: "person", value: arr };
    }
    case "file": {
      const arr = Array.isArray(db.valueJson) ? (db.valueJson as string[]) : [];
      return { type: "file", value: arr };
    }
    default:
      return { type: "text", value: db.valueString ?? null };
  }
}

function toPropertyType(s: string): PropertyType {
  const normalized = s === "date" ? "date_time" : s;
  return (PROPERTY_TYPES as readonly string[]).includes(normalized)
    ? (normalized as PropertyType)
    : "text";
}

function valueDtoToDb(p: PropertyValueDto): DbValueUpdate {
  const base: DbValueUpdate = {
    valueString: null,
    valueNumber: null,
    valueBool: null,
    valueDate: null,
    valueJson: null,
    optionId: null,
  };

  switch (p.type) {
    case "text":
    case "email":
    case "url":
      return { ...base, valueString: p.value ?? null };

    case "number":
      return { ...base, valueNumber: p.value ?? null };

    case "checkbox":
      return { ...base, valueBool: p.value ?? null };

    case "date_time":
      return { ...base, valueDate: p.value ? new Date(p.value) : null };

    case "select":
    case "status":
      return { ...base, optionId: p.value ?? null };

    case "multi_select":
    case "person":
    case "file":
      return { ...base, valueJson: Array.isArray(p.value) ? p.value : [] };

    default:
      return base;
  }
}

export const DocumentService = {
  async updatePropertyDefinition({
    projectId,
    docId,
    propertyId,
    body,
  }: UpdatePropertyArgs) {
    await DocumentRepo.assertDocInProject(docId, projectId);
    const current = await DocumentRepo.getPropertyDefinition(
      projectId,
      propertyId
    );
    if (!current) throw new Error("PropertyDefinition not found");
    const fromType = (PROPERTY_TYPES as readonly string[]).includes(
      current.type
    )
      ? (current.type as PropertyType)
      : "text";
    const toType = body.type ?? fromType;
    return DocumentRepo.txUpdatePropertyDefinition({
      projectId,
      propertyId,
      updateBasics: { name: body.name ?? current.name, type: toType },
      fromType,
      toType,
      keepField: TARGET_FIELD[toType],
    });
  },

  async createProperty(args: CreatePropertyArgs) {
    const { projectId, docId, body } = args;

    await DocumentRepo.assertDocInProject(docId, projectId);
    const def = await DocumentRepo.createDef(projectId, body.name, body.type);
    let options: Array<OptionOut> = [];
    if (body.options?.length) {
      options = await DocumentRepo.savePropertyOptions(
        projectId,
        docId,
        def.id,
        body.options
      );
    }
    await DocumentRepo.ensureLink(docId, def.id);
    return { ...def, options };
  },

  async getHeader(projectId: string, docId: string) {
    await DocumentRepo.assertDocInProject(docId, projectId);
    const row = await DocumentRepo.findHeaderById(projectId, docId);
    if (!row) return null;

    const defs = (row as any).properties.map((link: any) => {
      const p = link;
      const t = toPropertyType(String(p.type));

      const valueDto =
        p.value !== undefined ? dbValueToDto(t, p.value ?? null) : undefined;

      return {
        id: p.id,
        name: p.name,
        type: t,
        options: (p.options ?? []).map((o: any) => ({
          id: o.id,
          value: o.value,
          color: o.color ?? null,
          position: o.position ?? null,
        })),
        ...(valueDto !== undefined ? { value: valueDto } : {}),
      };
    });

    return {
      id: row.id,
      projectId: row.projectId,
      title: row.title,
      description: row.description,
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : row.createdAt,
      updatedAt:
        row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : row.updatedAt,
      properties: defs,
    };
  },
  async patchHeader(
    projectId: string,
    docId: string,
    payload: PatchDocHeaderDto
  ) {
    await DocumentRepo.assertDocInProject(docId, projectId);
    if ("title" in payload || "description" in payload) {
      await DocumentRepo.updateBasics(docId, {
        title: payload.title,
        description: payload.description ?? null,
      });
    }

    if (payload.properties) {
      const current = (await DocumentRepo.findHeaderById(
        projectId,
        docId
      )) as RepoDocumentHeader | null;
      if (!current) throw new Error("Document not found");

      const incoming = Object.entries(payload.properties); 
      const incomingNames = incoming.map(([n]) => n);

      const existingDefs = await DocumentRepo.defsByNames(projectId, incomingNames);
const byName = new Map(existingDefs.map((d) => [d.name, d]));

for (const [name, pv] of incoming) {
  const existing = byName.get(name);

  if (!existing) {
    const created = await DocumentRepo.createDef(projectId, name, pv.type);
    byName.set(name, created);
    continue;
  }

  if (existing.type !== pv.type) {
    const updated = await DocumentRepo.txUpdatePropertyDefinition({
      projectId,
      propertyId: existing.id,
      updateBasics: { name, type: pv.type },
      fromType: existing.type as PropertyType,
      toType: pv.type as PropertyType,
      keepField: TARGET_FIELD[pv.type],
    });
    byName.set(name, updated);
  }
}

      for (const [name] of incoming) {
        const def = byName.get(name)!;
        await DocumentRepo.ensureLink(docId, def.id);
      }

      const links = await DocumentRepo.linksForDoc(docId);
      for (const link of links) {
        const keep = incomingNames.includes(link.property.name);
        if (!keep) {
          await DocumentRepo.deleteValue(docId, link.propertyId).catch(
            () => {}
          );
          await DocumentRepo.deleteLink(docId, link.propertyId).catch(() => {});
        }
      }

      // upsert values
      for (const [name, pv] of incoming) {
        const def = byName.get(name)!;
        const data = valueDtoToDb(pv);
        await DocumentRepo.upsertValue(docId, def.id, data);
      }
    }

    return this.getHeader(projectId, docId);
  },

  /** Upsert a property’s option list, returning the updated list (sorted by position). */
  async savePropertyOptions(
    projectId: string,
    docId: string,
    propertyId: string,
    options: SaveOptionInput[]
  ): Promise<OptionOut[]> {
    return DocumentRepo.savePropertyOptions(
      projectId,
      docId,
      propertyId,
      options
    );
  },

  /** Read current options for a property (guards that doc and property share a project). */
  async readPropertyOptions(
    projectId: string,
    docId: string,
    propertyId: string
  ): Promise<OptionOut[]> {
    return DocumentRepo.readPropertyOptions(projectId, docId, propertyId);
  },
  async setPropertyValue(
    projectId: string,
    docId: string,
    propertyId: string,
    pv: PropertyValueDto
  ) {
    await DocumentRepo.assertDocAndPropertySameProject(
      projectId,
      docId,
      propertyId
    );
    const data = valueDtoToDb(pv); // maps DTO -> DB columns (optionId, valueString, etc.)
    await DocumentRepo.upsertValue(docId, propertyId, data);
    return { ok: true };
  },

  async readPropertiesWithValues(projectId: string, docId: string) {
    await DocumentRepo.assertDocInProject(docId, projectId);
    return DocumentRepo.readPropertiesWithValues(projectId, docId);
  },
  // DELETE /api/projects/:projectId/docs/:docId/properties/:propertyId
  async deleteProperty(args: {
    projectId: string;
    docId: string;
    propertyId: string;
  }) {
    const { projectId, docId, propertyId } = args;
    await DocumentRepo.assertDocAndPropertySameProject(
      projectId,
      docId,
      propertyId
    );
    await DocumentRepo.txDeletePropertyFromDocAndMaybeGC({
      projectId,
      docId,
      propertyId,
    });
  },
  async deletePropertyOption(args: {
    projectId: string;
    docId: string;
    propertyId: string;
    optionId: string;
  }): Promise<void> {
    const { projectId, docId, propertyId, optionId } = args;

    await DocumentRepo.assertDocAndPropertySameProject(
      projectId,
      docId,
      propertyId
    );

    await DocumentRepo.txDeleteOptionSafe({ propertyId, optionId });
  },
  async patchPropertyOption(args: {
    projectId: string;
    docId: string;
    propertyId: string;
    optionId: string;
    body: PatchPropertyOptionDto;
  }) {
    const { projectId, docId, propertyId, optionId, body } = args;

    await DocumentRepo.assertDocAndPropertySameProject(
      projectId,
      docId,
      propertyId
    );

    return DocumentRepo.updateOption(propertyId, optionId, body);
  },
  ///////////////////////////////////////Editor Content ///////////////////////////////////////

  // GET /api/projects/:projectId/docs/:docId/content
  async getContent(args: {
    projectId: string;
    docId: string;
    userId: string;
  }): Promise<GetContentResult> {
    const { projectId, docId, userId } = args;

    if (!(await canRead(projectId, docId, userId))) {
      throw new Error("Forbidden");
    }

    const row = await DocumentRepo.findContent(projectId, docId);
    if (!row) throw new Error("Not found");

    return {
      id: row.id,
      content: row.content as unknown as DocContent, // we trust our own writes
      updatedAt: row.updatedAt,
    };
  },
  // PATCH /api/projects/:projectId/docs/:docId/content
  //autosaves with optimistic concurrency control (OCC)
  async updateContent(args: UpdateContentArgs): Promise<UpdateContentResult> {
    const { projectId, docId, userId, content, lastKnownUpdatedAt } = args;

    if (!(await canEdit(projectId, docId, userId))) {
      throw new Error("Forbidden");
    }

    // Payload size guard (protect DB + network)
    const bytes = Buffer.byteLength(JSON.stringify(content ?? ""));
    if (bytes > MAX_CONTENT_BYTES) {
      throw new Error("Content too large");
    }

    // OCC: update only if updatedAt matches client's lastKnownUpdatedAt (when provided)
    const updated = await DocumentRepo.updateContentIfCurrent(
      projectId,
      docId,
      toInputJson(content),
      lastKnownUpdatedAt
    );

    if (!updated) {
      const meta = await DocumentRepo.currentMeta(projectId, docId);
      return { mutated: false, currentUpdatedAt: meta.updatedAt };
    }

    const meta = await DocumentRepo.currentMeta(projectId, docId);
    return { mutated: true, updatedAt: meta.updatedAt };
  },
};
/* -------------------------------------------------------------------------- */
/*                               Permissions                                  */
/* -------------------------------------------------------------------------- */

async function canRead(projectId: string, docId: string, userId: string) {
  if (isAuthDisabled()) return true;

  if (await accessRepo.isProjectMember(projectId, userId)) return true;

  const role = await accessRepo.getDocCollaboratorRole(docId, userId);
  return role !== null; // VIEWER | COMMENTER | EDITOR
}
async function canEdit(projectId: string, docId: string, userId: string) {
  if (isAuthDisabled()) return true;

  if (await accessRepo.isProjectMember(projectId, userId)) return true;

  const role = await accessRepo.getDocCollaboratorRole(docId, userId);
  return role === "COMMENTER" || role === "EDITOR";
}
