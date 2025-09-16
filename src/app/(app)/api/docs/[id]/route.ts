import { NextResponse } from "next/server";
import { DocumentService } from "@/modules/documents/services/document.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Params) {
  const { id } = await ctx.params;
  const data = await DocumentService.getHeader(id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, ctx: Params) {
  const { id } = await ctx.params;

  const body = (await req.json()) as Partial<{
    title: string;
    description: string | null;
    properties: Record<string, unknown>;
  }>;

  const data = await DocumentService.patchHeader(id, body);
  return NextResponse.json(data);
}
