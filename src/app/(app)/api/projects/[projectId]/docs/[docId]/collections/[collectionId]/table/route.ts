// GET /api/projects/:projectId/docs/:docId/collections/:collectionId/table
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { TableService } from "@/modules/table/service/table.service";

type Params = { projectId: string; docId: string; collectionId: string };

export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { projectId, collectionId } = await ctx.params;
    await requireUser(); // auth
    const data = await TableService.listRows(projectId, collectionId);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  try {
    const { projectId, collectionId } = await ctx.params;
    const body = await req.json();
    await requireUser();
    await TableService.renameTable(
      projectId,
      collectionId,
      String(body?.name ?? "")
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
