//src/app/api/projects/[projectId]/docs/[docId]/collections/timeline/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { parseProjectDocParams } from "@/modules/documents/dto/doc.dto";
import { TimelineService } from "@/modules/timeline/services/timeline.service";
import {
  CreateTimelineDto,
  ListTimelineCollectionsResponseDto,
} from "@/modules/timeline/dto/timeline.dto";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const CreateTimelineBody = z.object({
  name: z.string().min(1).default("Timeline"),
});

function jsonError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation Error", issues: err.issues },
      { status: 400 }
    );
  }
  const code = (err as { code?: string })?.code;
  if (code === "NOT_FOUND")
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  console.error("[collections:timeline:create] error", err);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; docId: string }> }
) {
  try {
    const params = await ctx.params; // Next 15: await ctx.params
    const { projectId, docId } = parseProjectDocParams(params);
    const body = CreateTimelineBody.parse(await req.json());
    const data = await TimelineService.createTimeline({
      projectId,
      docId,
      data: { name: body.name },
    });
    const res = NextResponse.json(data, { status: 201 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return jsonError(err);
  }
}
// GET — list timeline collections under this doc
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ projectId: string; docId: string }> }
) {
  try {
    const { projectId, docId } = parseProjectDocParams(await ctx.params);

    const collections = await TimelineService.listTimelinesForDoc({
      projectId,
      docId,
    });

    const body = ListTimelineCollectionsResponseDto.parse({
      collections,
    });

    const res = NextResponse.json(body, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return jsonError(err);
  }
}
