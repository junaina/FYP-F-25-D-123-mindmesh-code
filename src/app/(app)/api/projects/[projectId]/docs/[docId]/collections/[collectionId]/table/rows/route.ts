import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth"; // your helper in lib
import {
  DocInCollectionParamsDto,
  CreateRowBodyDto,
} from "@/modules/table/dto/table.dto";
import { TableService } from "@/modules/table/service/table.service";

// Next.js (newer versions) pass `params` as a Promise — we must await it.
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
    // 1) await and validate params
    const rawParams = await ctx.params;
    const { projectId, docId, collectionId } =
      DocInCollectionParamsDto.parse(rawParams);

    // 2) auth (dev mode supported via AUTH_DISABLED)
    const user = await requireUser();
    const userId = user.id;

    // 3) validate body
    const json = await req.json();
    const body = CreateRowBodyDto.parse(json);

    // 4) create the wiki (Document) and attach to table
    const doc = await TableService.createRow(projectId, collectionId, body, userId);

    // (optional) If you want to enforce the URL’s [docId] as the host document,
    // add a small guard in TableRepo and call it before createRow:
    // await TableRepo.assertCollectionBelongsToDoc(collectionId, docId);

    return NextResponse.json(doc, { status: 200 });
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
