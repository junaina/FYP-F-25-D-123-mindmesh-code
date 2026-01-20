// src/app/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/board/property/[propertyId]/options/reorder/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";

import {
  boardColumnSchema,
  reorderBoardColumnsDto,
} from "@/modules/board/dto/board.dto";
import { reorderBoardColumnsService } from "@/modules/board/service/board.service";

type Params = {
  projectId: string;
  docId: string;
  collectionId: string;
  propertyId: string;
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  try {
    const { projectId, docId, collectionId, propertyId } = await ctx.params;

    // auth
    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sid)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const raw = await req.json().catch(() => ({}));
    const dto = reorderBoardColumnsDto.parse(raw);

    const columns = await reorderBoardColumnsService({
      projectId,
      docId,
      collectionId,
      propertyId,
      order: dto.order,
    });

    return NextResponse.json(
      columns.map((c) => boardColumnSchema.parse(c)),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[board/options REORDER]", err);
    const msg = err?.message ?? "Internal Server Error";
    const status = /not found|property|option|board|order must contain/i.test(
      msg
    )
      ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
