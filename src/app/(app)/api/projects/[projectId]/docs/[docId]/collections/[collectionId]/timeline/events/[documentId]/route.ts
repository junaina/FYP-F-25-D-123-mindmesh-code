//src/app/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/timeline/events/[documentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { TimelineService } from "@/modules/timeline/services/timeline.service";
import {
  TimelineEventParamsDto,
  DeleteTimelineEventResponseDto,
} from "@/modules/timeline/dto/timeline.dto";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function jsonError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { message: "Validation failed", issues: err.issues },
      { status: 400 }
    );
  }
  const code = (err as { code?: string })?.code;
  if (code === "NOT_FOUND") {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }
  console.error("[timeline event DELETE] error:", err);
  return NextResponse.json(
    { message: "Internal Server Error" },
    { status: 500 }
  );
}

export async function DELETE(
  _req: NextRequest,
  ctx: {
    params: Promise<{
      projectId: string;
      docId: string;
      collectionId: string;
      documentId: string;
    }>;
  }
) {
  try {
    const { projectId, docId, collectionId, documentId } =
      TimelineEventParamsDto.parse(await ctx.params);

    const result = await TimelineService.deleteEvent({
      projectId,
      docId,
      collectionId,
      documentId,
    });

    const body = DeleteTimelineEventResponseDto.parse(result);
    const res = NextResponse.json(body, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return jsonError(err);
  }
}
