// src/modules/documents/repo/embed.repo.ts
import { prisma } from "@/lib/prisma";
import { DocumentRepo } from "./document.repo";
import type {
  GoogleDriveEmbedMeta,
  EmbedRow,
} from "@/modules/documents/domain/embed.types";

const GOOGLE_DRIVE_PDF_KIND = "google_drive_pdf" as const;

export const EmbedRepo = {
  /**
   * Create a Google Drive PDF embed attached to a document.
   * Assumes access checks are done at the service layer;
   * here we just assert the doc belongs to the project.
   */
  async createGoogleDrivePdf(args: {
    projectId: string;
    docId: string;
    url: string; // probably the preview link you’ll render in an <iframe>
    meta: GoogleDriveEmbedMeta;
  }): Promise<EmbedRow<GoogleDriveEmbedMeta>> {
    const { projectId, docId, url, meta } = args;

    // Safety: make sure doc is in this project
    await DocumentRepo.assertDocInProject(docId, projectId);

    const row = await prisma.embed.create({
      data: {
        projectId,
        documentId: docId,
        kind: GOOGLE_DRIVE_PDF_KIND,
        url,
        // prisma Json type → cast
        meta: meta as any,
      },
      select: {
        id: true,
        projectId: true,
        documentId: true,
        kind: true,
        url: true,
        meta: true,
        createdAt: true,
      },
    });

    return {
      ...row,
      kind: GOOGLE_DRIVE_PDF_KIND,
      meta: row.meta as GoogleDriveEmbedMeta | null,
    };
  },

  /**
   * List all embeds for a document (we’ll later filter on the service).
   */
  async listForDocument(args: {
    projectId: string;
    docId: string;
  }): Promise<EmbedRow[]> {
    const { projectId, docId } = args;

    await DocumentRepo.assertDocInProject(docId, projectId);

    const rows = await prisma.embed.findMany({
      where: { projectId, documentId: docId },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      documentId: r.documentId,
      kind: r.kind as any,
      url: r.url,
      meta: r.meta as any,
      createdAt: r.createdAt,
    }));
  },
};
