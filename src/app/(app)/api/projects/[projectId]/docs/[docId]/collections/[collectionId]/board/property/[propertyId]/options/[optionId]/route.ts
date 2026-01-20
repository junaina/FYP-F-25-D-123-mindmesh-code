// src/app/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/board/property/[propertyId]/options/[optionId]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";

import {
  boardColumnSchema,
  updateBoardColumnDto,
} from "@/modules/board/dto/board.dto";
import {
  updateBoardColumnService,
  deleteBoardColumnService,
} from "@/modules/board/service/board.service";

type Params = {
  projectId: string;
  docId: string;
  collectionId: string;
  propertyId: string;
  optionId: string;
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> },
) {
  try {
    const { projectId, docId, collectionId, propertyId, optionId } =
      await ctx.params;

    // 1) auth via session cookie
    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2) parse + validate body
    const raw = await req.json().catch(() => ({}));
    const dto = updateBoardColumnDto.parse(raw);

    // 3) update column
    const column = await updateBoardColumnService({
      projectId,
      docId,
      collectionId,
      propertyId,
      optionId,
      value: dto.value,
      color: dto.color,
    });

    return NextResponse.json(boardColumnSchema.parse(column), { status: 200 });
  } catch (err: any) {
    console.error("[board/options PATCH]", err);
    const msg = err?.message ?? "Internal Server Error";
    const status = /not found|option|property|board/i.test(msg) ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<Params> },
) {
  try {
    const { projectId, docId, collectionId, propertyId, optionId } =
      await ctx.params;

    // auth
    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sid)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    await deleteBoardColumnService({
      projectId,
      docId,
      collectionId,
      propertyId,
      optionId,
      hardDeleteItems: true, // per your rule: delete all items/docs in that column
    });

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error("[board/options DELETE]", err);
    const msg = err?.message ?? "Internal Server Error";
    const status = /not found|option|property|board/i.test(msg) ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
