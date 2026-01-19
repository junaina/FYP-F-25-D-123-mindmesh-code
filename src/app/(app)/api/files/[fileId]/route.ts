import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";
import {
  FileDownloadService,
  NotFoundError,
  ForbiddenError,
} from "@/modules/files/service/fileDownload.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: Promise<{ params: { fileId: string } }>,
) {
  const { params } = await context;
  const fileId = params.fileId;

  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getMeFromSessionId(sessionId);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = new FileDownloadService();

  try {
    const signedUrl = await svc.createSignedUrlForFile({
      fileId,
      userId: me.id,
    });
    return NextResponse.redirect(signedUrl, { status: 307 });
  } catch (err) {
    if (err instanceof NotFoundError)
      return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof ForbiddenError)
      return NextResponse.json({ error: err.message }, { status: 403 });
    console.error("file download error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
