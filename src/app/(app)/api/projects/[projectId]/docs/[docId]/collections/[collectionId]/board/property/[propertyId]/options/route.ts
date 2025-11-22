// src/app/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/board/property/[propertyId]/options/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";

import {
  boardPropertySchema,
  createBoardPropertyOptionsDto,
} from "@/modules/board/dto/board.dto";

import {
  getBoard,
  addOptionsToBoardPropertyService,
  getBoardPropertyWithOptionsService,
} from "@/modules/board/service/board.service";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      projectId: string;
      docId: string;
      collectionId: string;
      propertyId: string;
    };
  }
) {
  try {
    const { docId, collectionId, propertyId } = params;

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

    // 2) parse & validate body
    const rawBody = await req.json().catch(() => ({}));
    const { options } = createBoardPropertyOptionsDto.parse(rawBody);

    // 3) sanity: make sure board belongs to this doc
    const board = await getBoard(collectionId);
    if (board.hostDocumentId !== docId) {
      return NextResponse.json(
        { error: "board does not belong to this document" },
        { status: 400 }
      );
    }

    // 4) add options to property (can be empty → no-op)
    const property = await addOptionsToBoardPropertyService({
      collectionId,
      propertyId,
      optionLabels: options,
    });

    // 5) respond with updated property
    return NextResponse.json(boardPropertySchema.parse(property), {
      status: 201,
    });
  } catch (err: any) {
    console.error("Error adding options to board property:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
type Params = {
  projectId: string;
  docId: string;
  collectionId: string;
  propertyId: string;
};

export async function GET(_req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { projectId, docId, collectionId, propertyId } = await ctx.params;

    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const property = await getBoardPropertyWithOptionsService({
      projectId,
      docId,
      collectionId,
      propertyId,
    });

    return NextResponse.json(boardPropertySchema.parse(property), {
      status: 200,
    });
  } catch (err: any) {
    console.error("[board/property/options GET]", err);
    const msg = err?.message ?? "Internal Server Error";
    const status =
      /property not found/i.test(msg) || /board collection not found/i.test(msg)
        ? 400
        : 500;

    return NextResponse.json({ error: msg }, { status });
  }
}
