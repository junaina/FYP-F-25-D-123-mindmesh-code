// GET  /api/projects/[projectId]/docs/[docId]/collections/[collectionId]/table
import { NextRequest, NextResponse } from "next/server";
import { TableService } from "@/modules/table/service/table.service";
import { requireUser } from "@/lib/auth";

type GetParams = { projectId: string; docId: string; collectionId: string };

export async function GET(_req: NextRequest, ctx: { params: Promise<GetParams> }) {
  try {
    const { projectId, collectionId } = await ctx.params; // <-- await
    await requireUser();
    const rows = await TableService.listRows(projectId, collectionId);
    return NextResponse.json(rows, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
