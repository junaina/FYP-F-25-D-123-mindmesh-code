import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";
import {
  FileUploadService,
  BadRequestError,
  ForbiddenError,
} from "@/modules/files/service/fileUpload.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  context: Promise<{ params: { projectId: string } }>,
) {
  const { params } = await context;
  const projectId = params.projectId;

  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getMeFromSessionId(sessionId);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const files = body?.files;

  const svc = new FileUploadService();

  try {
    const result = await svc.presignUploads({
      projectId,
      userId: me.id,
      files,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof BadRequestError)
      return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof ForbiddenError)
      return NextResponse.json({ error: err.message }, { status: 403 });
    console.error("presign error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
