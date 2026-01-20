// src/app/(app)/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/board/items/[documentId]/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { deleteBoardItemService } from "@/modules/board/service/board.service";
import {
  UpdateBoardItemDto,
  boardCardSchema,
} from "@/modules/board/dto/board.dto";
import { updateBoardItemService } from "@/modules/board/service/board.service";

type Params = {
  projectId: string;
  docId: string;
  collectionId: string;
  documentId: string;
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  try {
    const { projectId, docId, collectionId, documentId } = await ctx.params;

    // 1) auth
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
    const raw = await req.json().catch(() => ({}));
    const dto = UpdateBoardItemDto.parse(raw);

    const card = await updateBoardItemService({
      projectId,
      docId,
      collectionId,
      documentId,
      title: dto.title,
      optionId: dto.optionId,
      position: dto.position,
    });

    return NextResponse.json(boardCardSchema.parse(card), { status: 200 });
  } catch (err: any) {
    console.error("[board/items PATCH]", err);
    const msg = err?.message ?? "Internal Server Error";
    const status = /not found|option|board/i.test(msg) ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  try {
    const { projectId, docId, collectionId, documentId } = await ctx.params;

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

    // 2) delete the card (archive underlying doc by default)
    await deleteBoardItemService({
      projectId,
      docId,
      collectionId,
      documentId,
      hardDeleteDocument: false, // flip to true if you want hard deletion
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("[board/items DELETE]", err);
    const msg = err?.message ?? "Internal Server Error";
    const status =
      /not found|board collection|card belongs to a different project/i.test(
        msg
      )
        ? 400
        : 500;

    return NextResponse.json({ error: msg }, { status });
  }
}
