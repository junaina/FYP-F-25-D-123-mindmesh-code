import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DocumentService } from "@/modules/documents/services/document.service";
import {
  createPropertyBodyDto,
  paramIdsDto,
} from "@/modules/documents/dto/doc.dto";
//POST /api/projects/:projectId/docs/:docId/properties

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; docId: string }> }
) {
  try {
    const { projectId, docId } = paramIdsDto.parse(await ctx.params);
    const body = createPropertyBodyDto.parse(await req.json());

    const created = await DocumentService.createProperty({
      projectId,
      docId,
      body,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", issues: err.issues },
        { status: 400 }
      );
    }
    if ((err as { code?: string }).code === "ALREADY_EXISTS") {
      return NextResponse.json(
        { message: "Property name already exists in this project" },
        { status: 409 }
      );
    }
    if ((err as { code?: string }).code === "NOT_FOUND") {
      return NextResponse.json(
        { message: "Project/Document not found" },
        { status: 404 }
      );
    }
    console.error(err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
