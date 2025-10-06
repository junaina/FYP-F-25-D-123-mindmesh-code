import { NextResponse, NextRequest } from "next/server";
import {
  getSettings,
  setSettings,
} from "@/modules/calendar/services/calendar.service";
import { PutSettingsBodyDto } from "@/modules/calendar/dto/calendar.dto";
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
// PUT /calendar/settings
export async function PUT(
  req: NextRequest,
  ctx: {
    params: Promise<{ projectId: string; docId: string; collectionId: string }>;
  }
) {
  try {
    const { projectId, docId, collectionId } = await ctx.params; // Next.js 15: await params
    const parsed = PutSettingsBodyDto.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { visiblePropertyIds } = parsed.data;
    const data = await setSettings(
      projectId,
      docId,
      collectionId,
      visiblePropertyIds
    );
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    const errorMessage =
      e && typeof e === "object" && "message" in e
        ? (e as { message?: string }).message
        : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
