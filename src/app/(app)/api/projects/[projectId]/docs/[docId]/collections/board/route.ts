// src/app/(app)/api/projects/[projectId]/docs/[docId]/collections/board/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";

import {
  boardSchema,
  createBoardForDocDto,
} from "@/modules/board/dto/board.dto";
import {
  getBoardsForDocument,
  createBoardInDocument,
} from "@/modules/board/service/board.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string; docId: string } }
) {
  try {
    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { docId } = params;

    const rawBody = await req.json().catch(() => ({}));
    const { name, allowExisting } = createBoardForDocDto.parse(rawBody);

    const board = await createBoardInDocument({
      hostDocumentId: docId,
      userId: me.id,
      name,
      allowExisting,
    });

    return NextResponse.json(boardSchema.parse(board), { status: 201 });
  } catch (err: any) {
    console.error("Error creating board for doc:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
type Params = {
  projectId: string;
  docId: string;
};

export async function GET(_req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { docId } = await ctx.params;

    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const boards = await getBoardsForDocument(docId);

    return NextResponse.json(
      boards.map((b) => boardSchema.parse(b)),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[collections/board GET]", err);
    const msg = err?.message ?? "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
