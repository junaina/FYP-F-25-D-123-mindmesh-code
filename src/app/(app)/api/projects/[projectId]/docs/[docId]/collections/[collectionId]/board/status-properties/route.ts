// status-properties/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";

import { boardStatusPropertiesSchema } from "@/modules/board/dto/board.dto";
import { getBoardStatusPropertiesService } from "@/modules/board/service/board.service";

type Params = {
  projectId: string;
  docId: string;
  collectionId: string;
};

export async function GET(_req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { projectId, docId, collectionId } = await ctx.params;

    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const data = await getBoardStatusPropertiesService({
      projectId,
      docId,
      collectionId,
    });

    return NextResponse.json(boardStatusPropertiesSchema.parse(data), {
      status: 200,
    });
  } catch (err: any) {
    console.error("[board/status-properties GET]", err);
    const msg = err?.message ?? "Internal Server Error";
    const status = /board collection not found/i.test(msg) ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
