import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { CollectionService } from "@/modules/table-view/services/collection.service";

import { parseProjectCollectionParams, parsePatchCollectionBody } 
  from "@/modules/table-view/dto/collection.dto";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function jsonError(e: unknown) {
  if (e instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation Error", issues: e.issues },
      { status: 400 }
    );
  }
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}


export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ projectId: string; collectionId: string }> }
) {
  try {
    const { projectId, collectionId } = parseProjectCollectionParams(await ctx.params);
    const data = await CollectionService.get(projectId, collectionId);
    if (!data) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return jsonError(e);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; collectionId: string }> }
) {
  try {
    const { projectId, collectionId } = parseProjectCollectionParams(await ctx.params);
    const patch = parsePatchCollectionBody(await req.json());
    const data = await CollectionService.patch(projectId, collectionId, patch);
    return NextResponse.json(data);
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ projectId: string; collectionId: string }> }
) {
  try {
    const { projectId, collectionId } = parseProjectCollectionParams(await ctx.params);
    await CollectionService.remove(projectId, collectionId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
