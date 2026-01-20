// POST  /api/projects/[projectId]/docs/[docId]/table   (or .../collections/table)
import { NextRequest, NextResponse } from "next/server";
import { CreateTableBodyDto } from "@/modules/table/dto/table.dto";
import { TableService } from "@/modules/table/service/table.service";
import { requireUser } from "@/lib/auth";

type PostParams = { projectId: string; docId: string };

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<PostParams> }
) {
  try {
    const { projectId, docId } = await ctx.params; // <-- await
    const body = await req.json();
    const parsed = CreateTableBodyDto.parse({
      name: body?.name,
      documentId: docId,
    });
    const user = await requireUser();
    const table = await TableService.createTable(projectId, parsed, user.id);
    return NextResponse.json(table, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
