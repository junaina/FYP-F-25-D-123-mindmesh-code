import { Content } from "@tiptap/core";
// app/(app)/api/projects/:projectId/docs/:docId/content
import { PatchDocContentRequestSchema } from "./../../../../../../../../modules/documents/dto/content.dto";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { accessRepo } from "@/modules/documents/repo/access.repo";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { DocumentService } from "@/modules/documents/services/document.service";
import * as AuthService from "@/modules/auth/service/auth.service";
import {
  PatchDocContentRequest,
  GetDocContentResponseSchema,
} from "@/modules/documents/dto/content.dto";

async function requireSessionUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return AuthService.getMeFromSessionId(sessionId);
}

//GET /api/projects/[projectId]/docs/[docId]/content

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ projectId: string; docId: string }> },
) {
  const { projectId, docId } = await ctx.params;
  const user = await requireSessionUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const doc = await DocumentService.getContent({
    projectId,
    docId,
    userId: user.id,
  });
  const body = GetDocContentResponseSchema.parse({
    ...doc,
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : doc.updatedAt,
  });
  return NextResponse.json(body);
}

//PATCH /api/projects/[projectId]/docs/[docId]/content
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ projectId: string; docId: string }> },
) {
  const { projectId, docId } = await ctx.params;
  const user = await requireSessionUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json();
  const { content, lastKnownUpdatedAt } =
    PatchDocContentRequestSchema.parse(json);
  try {
    console.log("json.content:", JSON.stringify(json.content, null, 2));
  } catch {
    console.log("json.content (raw):", json.content);
  }
  const res = await DocumentService.updateContent({
    projectId,
    docId,
    userId: user.id,
    content,
    lastKnownUpdatedAt,
  });

  return NextResponse.json(res);
}
