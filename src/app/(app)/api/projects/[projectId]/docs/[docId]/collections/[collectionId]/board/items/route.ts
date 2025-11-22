// src/app/(app)/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/board/items/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";

import {
  boardCardSchema,
  createBoardItemDto,
} from "@/modules/board/dto/board.dto";
import {
  getBoard,
  createBoardItemService,
} from "@/modules/board/service/board.service";

export async function POST(
  req: NextRequest,
  ctx: {
    params: Promise<{
      projectId: string;
      docId: string;
      collectionId: string;
    }>;
  }
) {
  try {
    const { projectId, docId, collectionId } = await ctx.params;

    // 1) auth via session cookie (same as meetings & your other routes)
    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2) parse body
    const raw = await req.json().catch(() => ({}));
    const { propertyId, optionId, title } = createBoardItemDto.parse(raw);

    // 3) sanity: ensure board belongs to this doc
    const board = await getBoard(collectionId);
    if (board.hostDocumentId !== docId) {
      return NextResponse.json(
        { error: "board does not belong to this document" },
        { status: 400 }
      );
    }

    // 4) create card
    const card = await createBoardItemService({
      projectId,
      docId,
      collectionId,
      propertyId,
      optionId,
      title: title ?? "Untitled",
      userId: me.id,
    });

    // 5) respond with BoardCard dto
    return NextResponse.json(boardCardSchema.parse(card), { status: 201 });
  } catch (err: any) {
    console.error("[board/items POST]", err);
    const msg = err?.message ?? "Internal Server Error";
    const status = /not found|property|option|board collection/i.test(msg)
      ? 400
      : 500;

    return NextResponse.json({ error: msg }, { status });
  }
}

export async function GET(
  _req: NextRequest,
  ctx: {
    params: Promise<{
      projectId: string;
      docId: string;
      collectionId: string;
    }>;
  }
) {
  try {
    const { collectionId } = await ctx.params;

    // auth
    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // load board and return just the cards
    const board = await getBoard(collectionId);
    const cards = board.cards.map((c) => boardCardSchema.parse(c));

    return NextResponse.json(cards, { status: 200 });
  } catch (err: any) {
    console.error("[board/items GET]", err);
    const msg = err?.message ?? "Internal Server Error";
    const status = /board not found|board collection/i.test(msg) ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
