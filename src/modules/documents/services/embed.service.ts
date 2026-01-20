// src/modules/documents/services/embed.service.ts
import { isAuthDisabled } from "@/lib/auth";
import { accessRepo } from "@/modules/documents/repo/access.repo";
import { EmbedRepo } from "@/modules/documents/repo/embed.repo";
import type { GoogleDriveEmbedMeta } from "../domain/embed.types";

// same logic pattern as in document.service.ts
async function canEdit(projectId: string, docId: string, userId: string) {
  if (isAuthDisabled()) return true;

  if (await accessRepo.isProjectMember(projectId, userId)) {
    return true;
  }

  const role = await accessRepo.getDocCollaboratorRole(docId, userId);
  return role === "COMMENTER" || role === "EDITOR";
}

export const EmbedService = {
  /**
   * Create a Google Drive PDF embed for a document.
   * Throws "Forbidden" if the user cannot edit the doc.
   */
  async addGoogleDrivePdf(args: {
    projectId: string;
    docId: string;
    userId: string;
    url: string;
    meta: GoogleDriveEmbedMeta;
  }) {
    const { projectId, docId, userId, url, meta } = args;

    const allowed = await canEdit(projectId, docId, userId);
    if (!allowed) {
      const err: any = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    return EmbedRepo.createGoogleDrivePdf({
      projectId,
      docId,
      url,
      meta,
    });
  },

  /**
   * List embeds for a document (handy for a sidebar later).
   */
  async listForDoc(args: { projectId: string; docId: string; userId: string }) {
    const { projectId, docId, userId } = args;

    const allowed = await canEdit(projectId, docId, userId);
    if (!allowed) {
      const err: any = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    return EmbedRepo.listForDocument({ projectId, docId });
  },
};
