import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import {
  // params: projectId, docId, collectionId
  DocInCollectionParamsDto,
  // body: { name, type, options? }
  AddColumnBodyDto,
} from "@/modules/table/dto/table.dto";

import { TableService } from "@/modules/table/service/table.service";

// Next.js (newer versions) expose params as a Promise – must await.
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
    // 1) await + validate params
    const rawParams = await ctx.params;
    const { projectId, docId, collectionId } =
      DocInCollectionParamsDto.parse(rawParams);

    // 2) auth (dev mode allowed via AUTH_DISABLED)
    const user = await requireUser();
    const userId = user.id;

    // 3) validate body
    const json = await req.json();
    const body = AddColumnBodyDto.parse(json);

    // 4) create property (column) and make it visible in this table
    // Your TableService already wires into repo & docs layers.
    const property = await TableService.addColumn(
      projectId,
      collectionId,
      body,
    );

    // If you want to strictly ensure the URL's docId is the table host doc,
    // add a repo guard like assertCollectionBelongsToDoc(collectionId, docId)
    // and call it before addColumn(...). It's optional.

    return NextResponse.json(property, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", issues: err.issues },
        { status: 400 }
      );
    }
    const msg = (err as Error)?.message || "Internal error";
    const status =
      msg.includes("not found") ||
      msg.includes("mismatch") ||
      msg.includes("not in this table")
        ? 404
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
