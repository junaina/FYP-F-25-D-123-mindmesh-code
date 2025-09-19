import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DocumentService } from "@/modules/documents/services/document.service";
import {
  paramIdsDto,
  patchPropertyOptionDto,
} from "@/modules/documents/dto/doc.dto";

const paramsDto = paramIdsDto.extend({
  propertyId: z.string().uuid(),
  optionId: z.string().uuid(),
});

export async function DELETE(
  _req: NextRequest,
  ctx: {
    params: Promise<{
      projectId: string;
      docId: string;
      propertyId: string;
      optionId: string;
    }>;
  }
) {
  try {
    const { projectId, docId, propertyId, optionId } = paramsDto.parse(
      await ctx.params
    );

    await DocumentService.deletePropertyOption({
      projectId,
      docId,
      propertyId,
      optionId,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    if (err instanceof Error) {
      if (
        "code" in err &&
        (err as { code?: string }).code === "OPTION_IN_USE"
      ) {
        return NextResponse.json(
          { message: "Cannot delete option: it is referenced elsewhere." },
          { status: 409 }
        );
      }
      if (err.message.includes("Option not found")) {
        return NextResponse.json(
          { message: "Option not found" },
          { status: 404 }
        );
      }
      if (
        err.message.includes("PropertyDefinition not found") ||
        err.message.includes("Document not found")
      ) {
        return NextResponse.json(
          { message: "Project/Document/Property not found" },
          { status: 404 }
        );
      }
    }
    console.error(err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
// PATCH /api/projects/:projectId/docs/:docId/properties/:propertyId/options/:optionId
export async function PATCH(
  req: NextRequest,
  ctx: {
    params: Promise<{
      projectId: string;
      docId: string;
      propertyId: string;
      optionId: string;
    }>;
  }
) {
  try {
    const { projectId, docId, propertyId, optionId } = paramsDto.parse(
      await ctx.params
    );
    const body = patchPropertyOptionDto.parse(await req.json());

    const updated = await DocumentService.patchPropertyOption({
      projectId,
      docId,
      propertyId,
      optionId,
      body,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    // Strongly-typed narrowing
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", issues: err.issues },
        { status: 400 }
      );
    }
    if (err instanceof Error) {
      // repo maps unique conflict to code "P2002"
      if ("code" in err && (err as { code?: string }).code === "P2002") {
        return NextResponse.json(
          { message: "An option with this value already exists" },
          { status: 409 }
        );
      }
      if (err.message.includes("Option not found")) {
        return NextResponse.json(
          { message: "Option not found" },
          { status: 404 }
        );
      }
      if (
        err.message.includes("PropertyDefinition not found") ||
        err.message.includes("Document not found")
      ) {
        return NextResponse.json(
          { message: "Project/Document/Property not found" },
          { status: 404 }
        );
      }
    }
    console.error(err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
