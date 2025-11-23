// src/app/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/board/property/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";

import {
  boardPropertySchema,
  createBoardPropertyDto,
} from "@/modules/board/dto/board.dto";

import {
  getBoard,
  createStatusPropertyForBoardService,
} from "@/modules/board/service/board.service";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: { projectId: string; docId: string; collectionId: string };
  }
) {
  try {
    const { docId, collectionId } = params;

    // 1) auth via session cookie (same as meetings)
    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2) validate body
    const rawBody = await req.json().catch(() => ({}));
    const { name, options } = createBoardPropertyDto.parse(rawBody);

    // 3) sanity: ensure board belongs to doc
    const board = await getBoard(collectionId);
    if (board.hostDocumentId !== docId) {
      return NextResponse.json(
        { error: "board does not belong to this document" },
        { status: 400 }
      );
    }

    // 4) create status property + options
    const property = await createStatusPropertyForBoardService({
      collectionId,
      name,
      optionLabels: options ?? [],
    });

    // 5) respond with the property + its options
    return NextResponse.json(boardPropertySchema.parse(property), {
      status: 201,
    });
  } catch (err: any) {
    console.error("Error creating board property:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
