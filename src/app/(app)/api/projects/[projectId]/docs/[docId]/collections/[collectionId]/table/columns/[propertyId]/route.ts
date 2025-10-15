import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { TableService } from "@/modules/table/service/table.service";
import { UpdateColumnBodyDto } from "@/modules/table/dto/table.dto";

type Params = {
  projectId: string;
  docId: string;
  collectionId: string;
  propertyId: string;
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  try {
    const { projectId, collectionId, propertyId } = await ctx.params;
    await requireUser();
    const body = UpdateColumnBodyDto.parse(await req.json());
    const def = await TableService.updateColumn(
      projectId,
      collectionId,
      propertyId,
      body
    );
    return NextResponse.json(def, { status: 200 });
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
    const { projectId, collectionId, propertyId } = await ctx.params;
    await requireUser();
    await TableService.deleteColumn(projectId, collectionId, propertyId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
