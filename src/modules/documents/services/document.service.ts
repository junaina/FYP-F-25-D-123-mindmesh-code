import { DocumentRepo } from "@/modules/documents/repo/document.repo";
import {
  buildApiProps,
  primitiveToDb,
} from "@/modules/documents/mappers/property.mapper";

type PatchPayload = Partial<{
  title: string;
  description: string | null;
  properties: Record<string, unknown>;
}>;

export const DocumentService = {
  async getHeader(id: string) {
    const row = await DocumentRepo.findHeaderById(id);
    if (!row) return null;

    const props = buildApiProps(row.properties, row.propertyValues);

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

      // ensure links for new names
      for (const n of incomingNames) {
        const def = byName.get(n)!;
        await DocumentRepo.ensureLink(id, def.id);
      }

      // remove links+values for names not present anymore
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
        const data = primitiveToDb(def.type, raw);
        await DocumentRepo.upsertValue(id, def.id, data);
      }
    }

    return this.getHeader(id);
  },
};
