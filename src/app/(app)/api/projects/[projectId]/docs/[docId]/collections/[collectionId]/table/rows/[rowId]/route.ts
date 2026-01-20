import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { TableService } from "@/modules/table/service/table.service";
import { RenameRowBodyDto } from "@/modules/table/dto/table.dto";

type Params = {
  projectId: string;
  docId: string;
  collectionId: string;
  rowId: string;
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  try {
    const { projectId, collectionId, rowId } = await ctx.params;
    await requireUser();
    const body = RenameRowBodyDto.parse(await req.json());
    await TableService.renameRow(projectId, collectionId, rowId, body);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  try {
    const { projectId, collectionId, rowId } = await ctx.params;
    await requireUser();
    await TableService.deleteRow(projectId, collectionId, rowId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
