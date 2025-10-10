//src/app/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/timeline/events/[documentId]/move/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { TimelineService } from "@/modules/timeline/services/timeline.service";
import {
  TimelineEventParamsDto,
  MoveTimelineEventBodyDto,
  OkResponseDto,
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
  if (code === "NOT_FOUND")
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  if (code === "BAD_REQUEST")
    return NextResponse.json({ message: "Invalid move" }, { status: 400 });
  console.error("[timeline event MOVE] error:", err);
  return NextResponse.json(
    { message: "Internal Server Error" },
    { status: 500 }
  );
}

export async function PATCH(
  req: NextRequest,
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

    const body = MoveTimelineEventBodyDto.parse(await req.json());
    const resObj = await TimelineService.moveEvent({
      projectId,
      docId,
      collectionId,
      documentId,
      to: body.to,
    });

    const json = OkResponseDto.parse(resObj);
    const res = NextResponse.json(json, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return jsonError(err);
  }
}
