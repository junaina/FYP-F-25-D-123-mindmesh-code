import { DocumentRepo } from "../repo/document.repo";
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

// const OPTION_TYPES = new Set<PropertyType>([
//   "select",
//   "status",
//   "multi_select",
//   "person",
//   "file",
//   "url",
//   "email",
// ]);
//when creating a property
type CreatePropertyArgs = {
  projectId: string;
  docId: string;
  body: CreatePropertyBodyDto;
};

/** --- repo payload shapes we read (minimal, matches your prisma selects) --- */
type RepoPropertyOption = {
  id: string;
  value: string;
  color: string | null;
  position: number | null;
};

type RepoPropertyDefinition = {
  id: string;
  name: string;
  type: string; // we’ll narrow to PropertyType safely
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

/** --- the exact shape upsertValue expects based on your prisma model --- */
type DbValueUpdate = {
  valueString: string | null;
  valueNumber: number | null;
  valueBool: boolean | null;
  valueDate: Date | null;
  valueJson: string[] | null; // multi_select/person/file store string IDs
  optionId: string | null; // select/status -> PropertyOption.id
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
/** narrow a string to PropertyType (fallback to "text" if unknown) */
function toPropertyType(s: string): PropertyType {
  return (PROPERTY_TYPES as readonly string[]).includes(s)
    ? (s as PropertyType)
    : "text";
}

/** map a PropertyValueDto to the DB update shape (no stale columns left set) */
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
      // exhaustive by design; base keeps all columns null
      return base;
  }
}

export const DocumentService = {
  // when updating a property definition
  // PATCH /api/projects/:projectId/docs/:docId/properties/:propertyId
  async updatePropertyDefinition({
    projectId,
    docId,
    propertyId,
    body,
  }: UpdatePropertyArgs) {
    // 1. verify project/doc/property exist and are linked
    await DocumentRepo.assertDocInProject(docId, projectId);
    //load current def (with options)
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
    //update using repo
    return DocumentRepo.txUpdatePropertyDefinition({
      projectId,
      propertyId,
      updateBasics: { name: body.name ?? current.name, type: toType },
      fromType,
      toType,
      keepField: TARGET_FIELD[toType],
    });
  },

  // POST /api/projects/:projectId/docs/:docId/properties
  async createProperty(args: CreatePropertyArgs) {
    const { projectId, docId, body } = args;

    // 1. verifying project/doc exist and are linked
    await DocumentRepo.assertDocInProject(docId, projectId);
    //2. create definition
    const def = await DocumentRepo.createDef(projectId, body.name, body.type);
    //3.. upsert options if provided
    let options: Array<OptionOut> = [];
    if (body.options?.length) {
      options = await DocumentRepo.savePropertyOptions(
        projectId,
        docId,
        def.id,
        body.options
      );
    }
    //4. link to doc
    await DocumentRepo.ensureLink(docId, def.id);
    return { ...def, options };
  },

  /** GET /api/docs/:id */
  async getHeader(projectId: string, docId: string) {
    await DocumentRepo.assertDocInProject(docId, projectId);
    const row = (await DocumentRepo.findHeaderById(
      projectId,
      docId
    )) as RepoDocumentHeader;
    if (!row) return null;

    const defs = row.properties.map((link) => {
      const t = toPropertyType(link.property.type);
      return {
        id: link.property.id,
        name: link.property.name,
        type: t,
        options: link.property.options.map((o) => ({
          id: o.id,
          value: o.value,
          color: o.color ?? null,
          position: o.position ?? null,
        })),
      };
    });

    return {
      id: row.id,
      projectId: row.projectId,
      title: row.title,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      properties: defs,
    };
  },

  /** PATCH /api/docs/:id */
  async patchHeader(
    projectId: string,
    docId: string,
    payload: PatchDocHeaderDto
  ) {
    await DocumentRepo.assertDocInProject(docId, projectId);
    // 1) basics
    if ("title" in payload || "description" in payload) {
      await DocumentRepo.updateBasics(docId, {
        title: payload.title,
        description: payload.description ?? null,
      });
    }

    // 2) values (optional)
    if (payload.properties) {
      const current = (await DocumentRepo.findHeaderById(
        projectId,
        docId
      )) as RepoDocumentHeader | null;
      if (!current) throw new Error("Document not found");

      const incoming = Object.entries(payload.properties); // [ [name, PropertyValueDto], ... ]
      const incomingNames = incoming.map(([n]) => n);

      // ensure defs (create if missing with incoming type)
      const existingDefs = await DocumentRepo.defsByNames(
        projectId,
        incomingNames
      );
      const byName = new Map(existingDefs.map((d) => [d.name, d]));

      for (const [name, pv] of incoming) {
        if (!byName.has(name)) {
          const created = await DocumentRepo.createDef(
            projectId,
            name,
            pv.type // persist the first-seen type for this name
          );
          byName.set(name, created);
        }
      }

      // ensure links
      for (const [name] of incoming) {
        const def = byName.get(name)!;
        await DocumentRepo.ensureLink(docId, def.id);
      }

      // prune links/values not present in the payload (optional behavior)
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
};
