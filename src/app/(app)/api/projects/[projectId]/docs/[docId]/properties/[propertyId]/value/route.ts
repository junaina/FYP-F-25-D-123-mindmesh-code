import { NextRequest, NextResponse } from "next/server";
import {
  parseProjectDocPropParams,
  PropertyValueDto,
} from "@/modules/documents/dto/doc.dto";
import { DocumentService } from "@/modules/documents/services/document.service";
function jsonError(err: unknown, status = 400) {
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message)
      : "Validation Error";
  return NextResponse.json({ error: msg }, { status });
}
export async function PATCH(
  req: NextRequest,
  ctx: {
    params: Promise<{ projectId: string; docId: string; propertyId: string }>;
  }
) {
  try {
    const params = await ctx.params; // Next 15: params is a Promise
    const { projectId, docId, propertyId } = parseProjectDocPropParams(params);

    const body = await req.json();
    // body must be { value: PropertyValueDto }
    const pv = PropertyValueDto.parse(body?.value);

    await DocumentService.setPropertyValue(projectId, docId, propertyId, pv);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // If you use zod everywhere, you may want to return details:
    // if (err instanceof ZodError) return NextResponse.json({ error: "Validation Error", issues: err.issues }, { status: 400 });
    return jsonError(err, 400);
  }
}
