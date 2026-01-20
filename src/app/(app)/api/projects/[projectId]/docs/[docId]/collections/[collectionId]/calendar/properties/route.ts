import { NextResponse } from "next/server";
import { listProperties } from "@/modules/calendar/services/calendar.service";
import { PropertiesResponseDto } from "@/modules/calendar/dto/calendar.dto";

type Params = { projectId: string; docId: string; collectionId: string };
type Ctx = { params: Params | Promise<Params> };
const getParams = async (ctx: Ctx) =>
  ctx.params instanceof Promise ? await ctx.params : ctx.params;

export async function GET(_req: Request, ctx: Ctx) {
  const { projectId, docId, collectionId } = await getParams(ctx);
  const data = await listProperties(projectId, docId, collectionId);
  return NextResponse.json(PropertiesResponseDto.parse(data));
}
