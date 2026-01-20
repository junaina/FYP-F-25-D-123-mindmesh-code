// src/modules/documents/domain/embed.types.ts
export type EmbedKind = "google_drive_pdf" | "github_pr" | "github_issue";

export type GoogleDriveEmbedMeta = {
  driveFileId: string;
  name: string;
  mimeType: string;
  iconUrl?: string | null;
  webViewLink: string; // normal Google Drive view URL
  previewLink: string; // https://drive.google.com/file/d/<id>/preview
};
export type GitHubBaseMeta = {
  owner: string;
  repo: string;
  number: number;
  title: string;
  author: string; // login
  updatedAt: string; // ISO string
  htmlUrl: string;
};

export type GitHubIssueMeta = GitHubBaseMeta & {
  type: "issue";
  state: "OPEN" | "CLOSED";
};

export type GitHubPRMeta = GitHubBaseMeta & {
  type: "pr";
  state: "OPEN" | "CLOSED" | "MERGED";
  merged: boolean;
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
