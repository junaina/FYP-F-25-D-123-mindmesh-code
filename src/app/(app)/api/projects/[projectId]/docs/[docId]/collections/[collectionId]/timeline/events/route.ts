//src/app/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/timeline/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  TimelineParamsDto,
  CreateTimelineEventDto, //TODO
  ListTimelineEventsResponseDto,
} from "@/modules/timeline/dto/timeline.dto";
import { TimelineService } from "@/modules/timeline/services/timeline.service";
import { CreateTimelineDto } from "@/modules/timeline/dto/timeline.dto";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(
  _req: NextRequest,
  ctx: {
    params: Promise<{
      projectId: string;
      docId: string;
      collectionId: string;
    }>;
  }
) {
  try {
    const { projectId, docId, collectionId } = TimelineParamsDto.parse(
      await ctx.params
    );

    const events = await TimelineService.listEvents({
      projectId,
      docId,
      collectionId,
    });

    const body = ListTimelineEventsResponseDto.parse({ events });

    const res = NextResponse.json(body);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", issues: err.issues },
        { status: 400 }
      );
    }
    console.error("[timeline/events GET] unexpected error:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { projectId, collectionId } = TimelineParamsDto.parse(
      await ctx.params
    );
    const json = await req.json();
    const data = CreateTimelineEventDto.parse(json);

    const created = await TimelineService.createEvent({
      projectId,
      collectionId,
      data,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", issues: err.issues },
        { status: 400 }
      );
    }
    console.error("[timeline/events POST]", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
