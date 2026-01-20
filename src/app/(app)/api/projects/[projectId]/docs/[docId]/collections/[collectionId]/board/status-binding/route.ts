export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";

import {
  boardSchema,
  updateBoardStatusBindingDto,
} from "@/modules/board/dto/board.dto";
import { updateBoardStatusBindingService } from "@/modules/board/service/board.service";

type Params = {
  projectId: string;
  docId: string;
  collectionId: string;
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  try {
    const { projectId, docId, collectionId } = await ctx.params;

    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sid)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const raw = await req.json().catch(() => ({}));
    const dto = updateBoardStatusBindingDto.parse(raw);

    const board = await updateBoardStatusBindingService({
      projectId,
      docId,
      collectionId,
      statusPropertyId: dto.statusPropertyId,
    });

    return NextResponse.json(boardSchema.parse(board), { status: 200 });
  } catch (err: any) {
    console.error("[board/status-binding PATCH]", err);
    const msg = err?.message ?? "Internal Server Error";
    const status = /status property not found|board collection not found/i.test(
      msg
    )
      ? 400
      : 500;

    return NextResponse.json({ error: msg }, { status });
  }
}
