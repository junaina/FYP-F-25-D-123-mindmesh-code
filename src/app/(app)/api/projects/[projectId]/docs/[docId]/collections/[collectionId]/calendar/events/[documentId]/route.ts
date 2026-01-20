import { NextRequest, NextResponse } from "next/server";
import {
  PatchEventBodyDto,
  DeleteModeQueryDto,
} from "@/modules/calendar/dto/calendar.dto";
import {
  moveEventSvc,
  resizeEventSvc,
  renameEventSvc,
  deleteEventSvc,
} from "@/modules/calendar/services/calendar.service";

export async function PATCH(
  req: NextRequest,
  ctx: {
    params: Promise<{
      projectId: string;
      collectionId: string;
      documentId: string;
    }>;
  }
) {
  try {
    const { projectId, documentId } = await ctx.params;
    const parsed = PatchEventBodyDto.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );

    const b = parsed.data;
    if (b.op === "rename") {
      await renameEventSvc({ projectId, documentId, title: b.title });
    } else if (b.op === "move") {
      await moveEventSvc({ projectId, documentId, deltaDays: b.deltaDays });
    } else {
      // resize
      await resizeEventSvc({
        projectId,
        documentId,
        edge: b.edge,
        to: b.to.slice(0, 10),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message ?? "Internal Server Error";
    const code = /before|after|cannot|required|unsupported/i.test(msg)
      ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: {
    params: Promise<{
      projectId: string;
      collectionId: string;
      documentId: string;
    }>;
  }
) {
  try {
    const { projectId, documentId } = await ctx.params; // Next.js 15: await params
    await deleteEventSvc(documentId, projectId); // pass projectId for optional verify
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    const msg = e?.message ?? "Internal Server Error";
    // If you kept the project verification, mismatches should be 400s:
    const code = /mismatch|not found/i.test(msg) ? 400 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
