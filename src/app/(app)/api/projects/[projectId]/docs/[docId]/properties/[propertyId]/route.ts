import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  parseProjectDocPropParams,
  parsePatchPropertyDef,
  paramIdsDto,
} from "@/modules/documents/dto/doc.dto";
import { DocumentService } from "@/modules/documents/services/document.service";
//PATCH /api/projects/:projectId/docs/:docId/properties/:propertyId

export async function PATCH(
  req: NextRequest,
  ctx: {
    params: Promise<{ projectId: string; docId: string; propertyId: string }>;
  }
) {
  try {
    const { projectId, docId, propertyId } = parseProjectDocPropParams(
      await ctx.params
    );
    const body = parsePatchPropertyDef(await req.json());
    const updated = await DocumentService.updatePropertyDefinition({
      projectId,
      docId,
      propertyId,
      body,
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", issues: err.issues },
        { status: 400 }
      );
    }
    if (
      (typeof err === "object" &&
        err !== null &&
        typeof (err as { code?: string }).code === "string" &&
        (err as { code?: string }).code === "P2003") ||
      (typeof (err as { code?: string }).code === "string" &&
        (err as { code?: string }).code === "OPTIONS_IN_USE")
    ) {
      return NextResponse.json(
        {
          message:
            "Cannot change type: property options are in use by task board columns/bindings.",
        },
        { status: 409 }
      );
    }
    const msg = (err as Error)?.message ?? "";
    if (
      msg.includes("Document not found") ||
      msg.includes("PropertyDefinition not found")
    ) {
      return NextResponse.json(
        { message: "Project/Document/Property not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
//ts might tweak
// DELETE /api/projects/:projectId/docs/:docId/properties/:propertyId
const paramsDto = paramIdsDto.extend({ propertyId: z.string().uuid() });
export async function DELETE(
  req: NextRequest,
  ctx: {
    params: Promise<{ projectId: string; docId: string; propertyId: string }>;
  }
) {
  try {
    const { projectId, docId, propertyId } = paramsDto.parse(await ctx.params);
    await DocumentService.deleteProperty({ projectId, docId, propertyId });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      typeof (err as { code?: string }).code === "string" &&
      (err as { code?: string }).code === "P2003"
    ) {
      return NextResponse.json(
        {
          message:
            "Cannot delete: property options are used by boards/bindings.",
        },
        { status: 409 }
      );
    }
    if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as { message: string }).message === "string" &&
      (err as { message: string }).message.includes("not found")
    ) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as { message: string }).message === "string" &&
      (err as { message: string }).message.includes("mismatch")
    ) {
      return NextResponse.json(
        { message: "Doc/Property project mismatch" },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
