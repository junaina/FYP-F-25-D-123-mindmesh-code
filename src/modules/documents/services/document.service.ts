// src/modules/documents/services/document.service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DocumentRepo } from "../repo/document.repo";
import {
  buildApiProps,
  primitiveToDb,
} from "@/modules/documents/mappers/property.mapper";
import type { PrimitiveInput } from "@/modules/documents/mappers/property.mapper";

type PatchPayload = Partial<{
  title: string;
  description: string | null;
  properties: Record<string, unknown>;
}>;

export const DocumentService = {
  async getHeader(id: string) {
    const row = await DocumentRepo.findHeaderById(id);
    if (!row) return null;

    // Map Prisma payload to the minimal shape buildApiProps expects
    const defs = row.properties.map((l) => ({
      id: l.property.id,
      name: l.property.name,
      type: l.property.type as any, // coerce prisma string -> PropertyType
      options: l.property.options.map((o) => ({
        id: o.id,
        value: o.value,
        color: o.color ?? null,
      })),
    }));

    const props = buildApiProps(defs);

    return {
      id: row.id,
      projectId: row.projectId,
      title: row.title,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      properties: props,
    };
  },

  async patchHeader(id: string, payload: PatchPayload) {
    // basics
    if (payload.title != null || payload.description !== undefined) {
      await DocumentRepo.updateBasics(id, {
        title: payload.title,
        description: payload.description ?? null,
      });
    }

    if (payload.properties) {
      const current = await DocumentRepo.findHeaderById(id);
      if (!current) throw new Error("Document not found");

      const incomingNames = Object.keys(payload.properties);

      // ensure defs
      const defs = await DocumentRepo.defsByNames(
        current.projectId,
        incomingNames
      );
      const byName = new Map(defs.map((d) => [d.name, d]));

      for (const n of incomingNames) {
        if (!byName.has(n)) {
          const created = await DocumentRepo.createDef(
            current.projectId,
            n,
            "text"
          );
          byName.set(n, created);
        }
      }

      // ensure links
      for (const n of incomingNames) {
        const def = byName.get(n)!;
        await DocumentRepo.ensureLink(id, def.id);
      }

      // remove stale links/values
      const links = await DocumentRepo.linksForDoc(id);
      for (const link of links) {
        const keep = [...byName.entries()].some(
          ([name, def]) =>
            def.id === link.propertyId && incomingNames.includes(name)
        );
        if (!keep) {
          await DocumentRepo.deleteValue(id, link.propertyId).catch(() => {});
          await DocumentRepo.deleteLink(id, link.propertyId).catch(() => {});
        }
      }

      // upsert values
      for (const [name, raw] of Object.entries(payload.properties)) {
        const def = byName.get(name)!;

        // Coerce runtime into your discriminated union for mapper
        const prim = { type: def.type as any, value: raw } as PrimitiveInput;

        // Mapper now returns the exact shape expected by the repo
        const data = primitiveToDb(prim);

        // (guard) if some JSON path ended up 'null' by future edits, drop it
        if ("valueJson" in data && (data as any).valueJson == null) {
          delete (data as any).valueJson;
        }

        await DocumentRepo.upsertValue(id, def.id, data);
      }
    }

    return this.getHeader(id);
  },
};
