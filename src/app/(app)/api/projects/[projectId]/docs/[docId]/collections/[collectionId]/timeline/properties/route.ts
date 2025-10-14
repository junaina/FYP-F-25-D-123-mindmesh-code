//src/app/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/timeline/properties/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { TimelineService } from "@/modules/timeline/services/timeline.service";
import {
  TimelineWithCollectionParamsDto,
  GetTimelinePropertiesResponseDto,
  PutTimelinePropertiesBodyDto,
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
  console.error("[timeline/properties] error:", err);
  return NextResponse.json(
    { message: "Internal Server Error" },
    { status: 500 }
  );
}

export async function GET(
  _req: NextRequest,
  ctx: {
    params: Promise<{ projectId: string; docId: string; collectionId: string }>;
  }
) {
  try {
    const { projectId, docId, collectionId } =
      TimelineWithCollectionParamsDto.parse(await ctx.params);
    const data = await TimelineService.getTimelineProperties({
      projectId,
      docId,
      collectionId,
    });
    const body = GetTimelinePropertiesResponseDto.parse(data);
    const res = NextResponse.json(body, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(
  req: NextRequest,
  ctx: {
    params: Promise<{ projectId: string; docId: string; collectionId: string }>;
  }
) {
  try {
    const { projectId, docId, collectionId } =
      TimelineWithCollectionParamsDto.parse(await ctx.params);
    const { visiblePropertyIds } = PutTimelinePropertiesBodyDto.parse(
      await req.json()
    );

    const data = await TimelineService.setTimelineVisibleProperties({
      projectId,
      docId,
      collectionId,
      visiblePropertyIds,
    });

    // Return the same shape as GET so the client can refresh state easily
    const body = GetTimelinePropertiesResponseDto.parse(data);
    const res = NextResponse.json(body, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return jsonError(err);
  }
}
