//api/projects/[projectId]/docs/[docId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  parseProjectDocParams,
  DocHeaderDto,
  parsePatchDocHeader,
} from "@/modules/documents/dto/doc.dto";
import { DocumentService } from "@/modules/documents/services/document.service";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
function jsonError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation Error", issues: err.issues },
      { status: 400 },
    );
  }
  // surface simple codes if you throw {code:"NOT_FOUND"} etc in services
  const code = (err as { code?: string })?.code;
  if (code === "NOT_FOUND") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  console.error("[docs route] unhandled error:", err);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function GET(
  _req: NextRequest,
  ctx: {
    params: Promise<{ projectId: string; docId: string }>;
  },
) {
  try {
    const params = await ctx.params;
    const { projectId, docId } = parseProjectDocParams(params);

    const data = await DocumentService.getHeader(projectId, docId);
    if (!data)
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    const res = NextResponse.json(DocHeaderDto.parse(data));
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: {
    params: Promise<{ projectId: string; docId: string }>;
  },
) {
  try {
    const params = await ctx.params;
    const { projectId, docId } = parseProjectDocParams(params);

    const body = parsePatchDocHeader(await req.json());
    const updated = await DocumentService.patchHeader(projectId, docId, body);
    return NextResponse.json(updated);
  } catch (err) {
    return jsonError(err);
  }
}
export async function DELETE(
  _req: NextRequest,
  ctx: {
    params: Promise<{ projectId: string; docId: string }>;
  },
) {
  try {
    const params = await ctx.params;
    const { projectId, docId } = parseProjectDocParams(params);

    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = await getMeFromSessionId(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // hard delete (service should enforce permissions)
    const result = await DocumentService.hardDeleteDoc({
      projectId,
      docId,
      userId: me.id,
    });

    return NextResponse.json(result);
  } catch (err) {
    return jsonError(err);
  }
}
