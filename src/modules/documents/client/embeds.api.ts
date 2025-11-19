// src/modules/documents/client/embeds.api.ts
import type {
  GoogleDriveEmbedMeta,
  EmbedRow,
} from "@/modules/documents/domain/embed.types";

export type GoogleDriveEmbedRow = EmbedRow<GoogleDriveEmbedMeta>;

/**
 * Create a Google Drive PDF embed for a document.
 * Calls POST /api/projects/[projectId]/docs/[docId]/embeds/google-drive
 */
export async function createGoogleDriveEmbed(args: {
  projectId: string;
  docId: string;
  url: string;
  name?: string;
}): Promise<GoogleDriveEmbedRow> {
  const { projectId, docId, url, name } = args;

  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/embeds/google-drive`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, name }),
    }
  );

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `[createGoogleDriveEmbed] ${res.status} ${res.statusText} – ${txt}`
    );
  }

  return (await res.json()) as GoogleDriveEmbedRow;
}
