//src/app/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/timeline/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { TimelineService } from "@/modules/timeline/services/timeline.service";
import {
  TimelineWithCollectionParamsDto,
  PatchTimelineNameDto,
  TimelineCollectionDto,
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
  console.error("[timeline PATCH] error:", err);
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
    }>;
  }
) {
  try {
    const { projectId, docId, collectionId } =
      TimelineWithCollectionParamsDto.parse(await ctx.params);

    const body = PatchTimelineNameDto.parse(await req.json());
    const updated = await TimelineService.renameTimeline({
      projectId,
      docId,
      collectionId,
      name: body.name,
    });

    // optional validation of the response shape
    const json = TimelineCollectionDto.parse(updated);

    const res = NextResponse.json(json, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return jsonError(err);
  }
}
