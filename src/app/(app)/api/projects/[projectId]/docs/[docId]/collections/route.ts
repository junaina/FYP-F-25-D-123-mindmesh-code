import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { CollectionService } from "@/modules/table-view/services/collection.service";

import { parseProjectDocParams } from "@/modules/documents/dto/doc.dto";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const CreateCollectionBody = z.object({
  name: z.string().min(1).default("Table"),
  type: z.literal("table").default("table")
});
type CreateCollectionBody = z.infer<typeof CreateCollectionBody>;

function jsonError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "Validation Error", issues: err.issues }, { status: 400 });
  }
  const code = (err as any)?.code;
  if (code === "NOT_FOUND") return NextResponse.json({ error: "Not Found" }, { status: 404 });
  console.error("[collections:create] error", err);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{projectId: string; docId: string}> }) {
  try {
    const params = await ctx.params;
    const { projectId, docId } = parseProjectDocParams(params);
    const body = CreateCollectionBody.parse(await req.json());
    const data = await CollectionService.createTable(projectId, docId, body.name);
    const res = NextResponse.json(data);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return jsonError(err);
  }
}
