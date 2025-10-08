import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { CreateEventBodyDto } from "@/modules/calendar/dto/calendar.dto";
import { createEventSvc } from "@/modules/calendar/services/calendar.service";

export async function POST(
  req: NextRequest,
  ctx: {
    params: Promise<{ projectId: string; docId: string; collectionId: string }>;
  }
) {
  try {
    const { projectId, collectionId } = await ctx.params;
    const user = await requireUser();

    const parsed = CreateEventBodyDto.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );

    const b = parsed.data;
    const res = await createEventSvc({
      projectId,
      collectionId,
      userId: user.id,
      title: b.title,
      mode: b.mode,
      date: b.date?.slice(0, 10),
      start: b.start?.slice(0, 10),
      end: b.end?.slice(0, 10),
      inheritAllCalendarProps: b.inheritAllCalendarProps,
    });

    return NextResponse.json(res, { status: 201 });
  } catch (e: any) {
    const msg = e?.message ?? "Internal Server Error";
    const code = /required|must|cannot/i.test(msg) ? 400 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
