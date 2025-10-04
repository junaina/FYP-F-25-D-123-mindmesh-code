import { NextResponse } from "next/server";
import { getSettings } from "@/modules/calendar/services/calendar.service";
import { SettingsResponseDto } from "@/modules/calendar/dto/calendar.dto";

type Params = { projectId: string; docId: string; collectionId: string };
type Ctx = { params: Params | Promise<Params> };
const getParams = async (ctx: Ctx) =>
  ctx.params instanceof Promise ? await ctx.params : ctx.params;

export async function GET(_req: Request, ctx: Ctx) {
  const { projectId, docId, collectionId } = await getParams(ctx);
  const data = await getSettings(projectId, docId, collectionId);
  return NextResponse.json(SettingsResponseDto.parse(data));
}
