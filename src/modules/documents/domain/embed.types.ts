// src/modules/documents/domain/embed.types.ts
export type EmbedKind = "google_drive_pdf";

export type GoogleDriveEmbedMeta = {
  driveFileId: string;
  name: string;
  mimeType: string;
  iconUrl?: string | null;
  webViewLink: string; // normal Google Drive view URL
  previewLink: string; // https://drive.google.com/file/d/<id>/preview
};

// Generic “row” shape you’ll get back from repo
export type EmbedRow<TMeta = unknown> = {
  id: string;
  projectId: string;
  documentId: string | null;
  kind: EmbedKind;
  url: string;
  meta: TMeta | null;
  createdAt: Date;
};
