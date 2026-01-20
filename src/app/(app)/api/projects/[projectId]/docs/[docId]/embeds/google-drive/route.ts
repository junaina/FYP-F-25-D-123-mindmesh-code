// src/app/(app)/api/projects/[projectId]/docs/[docId]/embeds/google-drive/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";
import { createDriveEmbedBodySchema } from "@/modules/documents/dto/embed.dto";
import { EmbedService } from "@/modules/documents/services/embed.service";

type RouteParams = {
  projectId: string;
  docId: string;
};
function extractDriveFileId(url: string): string | null {
  try {
    const u = new URL(url);

    // Handles:
    // - /file/d/<id>/view
    // - /file/u/0/d/<id>/view
    // - /file/u/1/d/<id>/view
    // - generally anything with /d/<id>/ in the path
    const m = u.pathname.match(/\/d\/([^/]+)/);
    if (m?.[1]) return m[1];

    // Fallback: ?id=<id>
    const id = u.searchParams.get("id");
    if (id) return id;

    return null;
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    // 1) current user from session cookie
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const me = await getMeFromSessionId(sessionId);
    if (!me) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2) parse + validate body
    const raw = await req.json().catch(() => null);
    if (!raw) {
      return new NextResponse("Invalid JSON body", { status: 400 });
    }

    const parsed = createDriveEmbedBodySchema.safeParse(raw);
    if (!parsed.success) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    const { url, name } = parsed.data;

    // 3) derive Drive file info → matches GoogleDriveEmbedMeta
    const fileId = extractDriveFileId(url);
    if (!fileId) {
      return new NextResponse("Could not parse Google Drive file ID", {
        status: 400,
      });
    }

    const meta = {
      driveFileId: fileId,
      name: name ?? "Google Drive file",
      mimeType: "application/pdf", // v1 is PDF-only
      iconUrl: null as string | null,
      webViewLink: url, // original URL user pasted
      previewLink: `https://drive.google.com/file/d/${fileId}/preview`,
    };

    // 4) call service
    const embed = await EmbedService.addGoogleDrivePdf({
      projectId: params.projectId,
      docId: params.docId,
      userId: me.id,
      url,
      meta,
    });

    // 5) return created embed row
    return NextResponse.json(embed, { status: 201 });
  } catch (err: any) {
    if (err?.status === 403 || err?.message === "Forbidden") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    if (err?.message === "Not found") {
      return new NextResponse("Not found", { status: 404 });
    }

    console.error("[POST] /embeds/google-drive error", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
