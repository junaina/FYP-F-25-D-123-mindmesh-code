import { NextResponse } from "next/server";
import { createCalendarCollection } from "@/modules/calendar/services/calendar.service";
import { requireUser } from "@/lib/auth";

type Params = { projectId: string; docId: string };

type Ctx = { params: Params | Promise<Params> };
const getParams = async (ctx: Ctx) =>
  ctx.params instanceof Promise ? await ctx.params : ctx.params;

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { projectId, docId } = await getParams(ctx);
    const user = await requireUser(); // { id, email }
    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const name: string = (body?.name ?? "Calendar").toString();

    const { id } = await createCalendarCollection({
      projectId,
      docId,
      userId,
      name,
      autoBindDateProperty: true, // just ensures date props exist (no visibility changes)
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err: any) {
    const message = String(err?.message ?? "Internal Error");
    const status = /unauthor/i.test(message)
      ? 401
      : /not found|mismatch/i.test(message)
      ? 400
      : 500;

    console.error("[POST collections/calendar] error:", message);
    return NextResponse.json({ error: message }, { status });
  }
}
