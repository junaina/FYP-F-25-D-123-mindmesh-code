// src/lib/google/uploadTranscriptToDrive.ts
import { Readable } from "stream";
import type { drive_v3 } from "googleapis";
import { getDriveClientFromRefreshToken } from "./driveClient";

export async function uploadTranscriptToDrive(args: {
  refreshToken: string;
  fileName: string;
  pdfBuffer: Buffer;
}): Promise<drive_v3.Schema$File> {
  const { refreshToken, fileName, pdfBuffer } = args;

  const drive = getDriveClientFromRefreshToken(refreshToken);

  const fileMetadata: drive_v3.Schema$File = {
    name: fileName,
    mimeType: "application/pdf",
  };

  const media = {
    mimeType: "application/pdf",
    body: Readable.from(pdfBuffer),
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, webViewLink, webContentLink",
  });

  return res.data;
}
