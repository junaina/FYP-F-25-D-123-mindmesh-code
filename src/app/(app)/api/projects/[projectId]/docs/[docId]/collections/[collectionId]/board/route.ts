// src/app/(app)/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/board/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";

import { boardSchema, updateBoardDto } from "@/modules/board/dto/board.dto";
import {
  getBoard,
  updateBoardService,
  deleteBoardService,
} from "@/modules/board/service/board.service";

type Params = {
  projectId: string;
  docId: string;
  collectionId: string;
};

/* ----------------------- GET → full board state ---------------------- */

export async function GET(_req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { collectionId } = await ctx.params;

    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const board = await getBoard(collectionId);
    return NextResponse.json(boardSchema.parse(board), { status: 200 });
  } catch (err: any) {
    console.error("[board GET]", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* ------------- PATCH → update board metadata (e.g. name) ------------- */

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> }
) {
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

    const raw = await req.json().catch(() => ({}));
    const dto = updateBoardDto.parse(raw);

    const board = await updateBoardService({
      projectId,
      docId,
      collectionId,
      name: dto.name,
    });

    return NextResponse.json(boardSchema.parse(board), { status: 200 });
  } catch (err: any) {
    console.error("[board PATCH]", err);
    const msg = err?.message ?? "Internal Server Error";
    const status = /board collection not found|board not found/i.test(msg)
      ? 400
      : 500;

    return NextResponse.json({ error: msg }, { status });
  }
}

/* ------------------- DELETE → delete the board view ------------------ */

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<Params> }
) {
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

    await deleteBoardService({ projectId, docId, collectionId });

    // board (Collection) is gone; underlying docs remain
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error("[board DELETE]", err);
    const msg = err?.message ?? "Internal Server Error";
    const status = /board collection not found/i.test(msg) ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
