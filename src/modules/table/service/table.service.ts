import { z } from "zod";
import { TableRepo } from "../repo/table.repo";
import { DocumentRepo } from "@/modules/documents/repo/document.repo";
import { DocumentService } from "@/modules/documents/services/document.service"; // keep your path

import {
  AddColumnBodyDto,
  CreateRowBodyDto,
  PatchCellBodyDto,
  RenameRowBodyDto,
  SaveOptionsBodyDto,
  UpdateColumnBodyDto,
  CreateTableBodyDto,
} from "../dto/table.dto";
import { PROPERTY_TYPES } from "@/modules/documents/domain/types";
import {
  getCollectionColumnPropertyIds,
  attachPropertiesToDocument,
} from "../repo/table.repo";
/** Infer TS types from Zod */
type AddColumnBody = z.infer<typeof AddColumnBodyDto>;
type UpdateColumnBody = z.infer<typeof UpdateColumnBodyDto>;
type CreateRowBody = z.infer<typeof CreateRowBodyDto>;
type RenameRowBody = z.infer<typeof RenameRowBodyDto>;
type PatchCellBody = z.infer<typeof PatchCellBodyDto>;
type SaveOptionsBody = z.infer<typeof SaveOptionsBodyDto>;
type CreateTableBody = z.infer<typeof CreateTableBodyDto>;

export const TableService = {
  /* ---------- collections / table ---------- */
  async createTable(projectId: string, body: CreateTableBody, userId: string) {
    // ensure host document belongs to the same project
    return TableRepo.createTableCollection(
      projectId,
      body.documentId,
      body.name,
      userId
    );
  },

  async renameTable(projectId: string, collectionId: string, name: string) {
    await TableRepo.assertCollectionInProject(collectionId, projectId);
    await TableRepo.renameCollection(collectionId, name);
  },

  /* ---------- schema (columns as union of doc properties) ---------- */
  async getSchema(projectId: string, collectionId: string) {
    await TableRepo.assertCollectionInProject(collectionId, projectId);
    const docIds = await TableRepo.docIdsInCollection(collectionId);
    return TableRepo.unionProperties(projectId, docIds);
  },

  async addColumn(
    projectId: string,
    collectionId: string,
    body: AddColumnBody
  ) {
    await TableRepo.assertCollectionInProject(collectionId, projectId);

    // 1) create project-scoped definition
    const def = await DocumentRepo.createDef(projectId, body.name, body.type);

    // 2) seed options if provided (need one doc context to call your option API)
    if (body.options?.length) {
      const oneDoc = await TableRepo.anyDocId(collectionId);
      if (oneDoc) {
        await DocumentRepo.ensureLink(oneDoc, def.id);
        await DocumentRepo.savePropertyOptions(
          projectId,
          oneDoc,
          def.id,
          body.options
        );
      }
    }

    // 3) link to ALL docs in table
    const docIds = await TableRepo.docIdsInCollection(collectionId);
    await TableRepo.linkPropertyToDocs(def.id, docIds);

    return def;
  },

  async updateColumn(
    projectId: string,
    collectionId: string,
    propertyId: string,
    body: UpdateColumnBody
  ) {
    await TableRepo.assertCollectionInProject(collectionId, projectId);

    // ensure linked to all docs
    const docIds = await TableRepo.docIdsInCollection(collectionId);
    await TableRepo.linkPropertyToDocs(propertyId, docIds);

    // migrate definition using your existing semantics
    const current = await DocumentRepo.getPropertyDefinition(
      projectId,
      propertyId
    );
    if (!current) throw new Error("Property not found");

    const nextType = (body.type ??
      (current.type as any)) as (typeof PROPERTY_TYPES)[number];

    return DocumentRepo.txUpdatePropertyDefinition({
      projectId,
      propertyId,
      updateBasics: { name: body.name ?? current.name, type: nextType },
      fromType: current.type as any,
      toType: nextType,
      keepField: (() => {
        switch (nextType) {
          case "select":
          case "status":
            return "optionId";
          case "text":
          case "email":
          case "url":
            return "valueString";
          case "number":
            return "valueNumber";
          case "checkbox":
            return "valueBool";
          case "date_time":
            return "valueDate";
          case "multi_select":
          case "person":
          case "file":
            return "valueJson";
          default:
            return "valueString";
        }
      })(),
    });
  },

  async deleteColumn(
    projectId: string,
    collectionId: string,
    propertyId: string
  ) {
    await TableRepo.assertCollectionInProject(collectionId, projectId);
    await TableRepo.unlinkPropertyAcrossCollection(collectionId, propertyId);
  },

  /* ---------- rows (documents) ---------- */
  async listRows(projectId: string, collectionId: string) {
    await TableRepo.assertCollectionInProject(collectionId, projectId);
    const rows = await TableRepo.listDocsWithValues(projectId, collectionId);
    return { rows, nextCursor: null }; // ← match the frontend’s RowsApi type
  },

  async createRow(
    projectId: string,
    collectionId: string,
    body: CreateRowBody,
    userId: string
  ) {
    await TableRepo.assertCollectionInProject(collectionId, projectId);

    // 1) create the document (make sure your TableRepo.createDoc sets EMPTY_TIPTAP_DOC)
    const doc = await TableRepo.createDoc(
      projectId,
      body.title,
      body.description,
      userId
    );

    // 2) link it into the collection
    await TableRepo.addDocToCollection(collectionId, doc.id, userId);

    // 3) attach this table's columns to the document (so the doc shows them immediately)
    const propertyIds = await getCollectionColumnPropertyIds(collectionId);
    await attachPropertiesToDocument(doc.id, propertyIds);

    // 4) if the caller passed initial values for some properties, apply them
    if (body.initialProperties) {
      await DocumentService.patchHeader(projectId, doc.id, {
        properties: body.initialProperties,
      });
    }

    return doc;
  },

  async deleteRow(projectId: string, collectionId: string, docId: string) {
    await TableRepo.assertCollectionInProject(collectionId, projectId);
    await TableRepo.assertDocInCollection(collectionId, docId);
    await TableRepo.unlinkDocFromCollection(collectionId, docId);
    await TableRepo.deleteDocument(docId);
    return { ok: true };
  },
  async renameRow(
    projectId: string,
    collectionId: string,
    docId: string,
    body: RenameRowBody
  ) {
    await TableRepo.assertDocInCollection(collectionId, docId);
    await DocumentRepo.updateBasics(docId, {
      title: body.title,
      description: body.description ?? null,
    });
  },

  /* ---------- cells (inline editing) ---------- */
  async patchCell(
    projectId: string,
    collectionId: string,
    docId: string,
    propertyId: string,
    body: PatchCellBody
  ) {
    await TableRepo.assertDocInCollection(collectionId, docId);
    await DocumentService.setPropertyValue(projectId, docId, propertyId, body);
    return { ok: true };
  },

  /* ---------- options ---------- */
  readOptions(projectId: string, collectionId: string, propertyId: string) {
    return TableRepo.readOptions(projectId, collectionId, propertyId);
  },

  async saveOptions(
    projectId: string,
    collectionId: string,
    propertyId: string,
    body: SaveOptionsBody
  ) {
    await TableRepo.assertCollectionInProject(collectionId, projectId);
    const docId = await TableRepo.anyDocId(collectionId);
    if (!docId) return [];
    return DocumentRepo.savePropertyOptions(
      projectId,
      docId,
      propertyId,
      body.options
    );
  },

  async patchOption(
    projectId: string,
    collectionId: string,
    propertyId: string,
    optionId: string,
    data: { value?: string; color?: string | null; position?: number | null }
  ) {
    await TableRepo.assertCollectionInProject(collectionId, projectId);
    return DocumentRepo.updateOption(propertyId, optionId, data);
  },

  async deleteOption(
    projectId: string,
    collectionId: string,
    propertyId: string,
    optionId: string
  ) {
    await TableRepo.assertCollectionInProject(collectionId, projectId);
    await DocumentRepo.txDeleteOptionSafe({ propertyId, optionId });
  },
};
