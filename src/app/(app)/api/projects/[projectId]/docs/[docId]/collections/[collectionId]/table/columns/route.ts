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
type Params = { projectId: string; docId: string; collectionId: string };

export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { projectId, collectionId } = await ctx.params;
    await requireUser();
    const body = AddColumnBodyDto.parse(await req.json());
    const def = await TableService.addColumn(projectId, collectionId, body);
    return NextResponse.json(def, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { projectId, collectionId } = await ctx.params;
    await requireUser();
    const columns = await TableService.getSchema(projectId, collectionId);
    return NextResponse.json(columns, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
