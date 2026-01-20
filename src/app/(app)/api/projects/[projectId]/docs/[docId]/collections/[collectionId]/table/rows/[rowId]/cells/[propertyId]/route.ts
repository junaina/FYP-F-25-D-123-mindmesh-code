import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { TableService } from "@/modules/table/service/table.service";
import { PatchCellBodyDto } from "@/modules/table/dto/table.dto";

type Params = {
  projectId: string;
  docId: string;
  collectionId: string;
  rowId: string;
  propertyId: string;
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  try {
    const { projectId, collectionId, rowId, propertyId } = await ctx.params;
    await requireUser();
    const body = PatchCellBodyDto.parse(await req.json());
    await TableService.patchCell(
      projectId,
      collectionId,
      rowId,
      propertyId,
      body
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
