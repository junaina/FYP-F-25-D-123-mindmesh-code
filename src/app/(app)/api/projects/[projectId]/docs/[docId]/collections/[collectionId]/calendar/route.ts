import { NextRequest, NextResponse } from "next/server";
import { listInstances } from "@/modules/calendar/services/calendar.service";
import {
  ListInstancesQueryDto,
  InstancesResponseDto,
} from "@/modules/calendar/dto/calendar.dto";

type Params = { projectId: string; docId: string; collectionId: string };
type Ctx = { params: Params | Promise<Params> };
const getParams = async (ctx: Ctx) =>
  ctx.params instanceof Promise ? await ctx.params : ctx.params;

export async function GET(req: NextRequest, ctx: Ctx) {
  const { projectId, docId, collectionId } = await getParams(ctx);

  const url = new URL(req.url);
  const parsed = ListInstancesQueryDto.safeParse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = await listInstances(
    projectId,
    collectionId,
    parsed.data.from,
    parsed.data.to,
    docId
  );
  const shaped = InstancesResponseDto.parse({ instances: data.instances }); // optional but nice
  return NextResponse.json(shaped);
}
