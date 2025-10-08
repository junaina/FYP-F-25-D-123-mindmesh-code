import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  parseProjectDocPropParams,
  parseSavePropertyOptions,
} from "@/modules/documents/dto/doc.dto";
import { DocumentService } from "@/modules/documents/services/document.service";

type RouteParams = {
  params: Promise<{ projectId: string; docId: string; propertyId: string }>;
};
function jsonError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "ValidationError", issues: err.issues },
      { status: 400 }
    );
  }
  // Optionally: detect Prisma unique violations and return 409, etc.
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { projectId, docId, propertyId } = parseProjectDocPropParams(
      await params
    );
    const { options } = await parseSavePropertyOptions(await req.json());
    const saved = await DocumentService.savePropertyOptions(
      projectId,
      docId,
      propertyId,
      options
    );
    return NextResponse.json({ options: saved });
  } catch (e) {
    return jsonError(e);
  }
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { projectId, docId, propertyId } = parseProjectDocPropParams(
      await params
    );
    const options = await DocumentService.readPropertyOptions(
      projectId,
      docId,
      propertyId
    );
    return NextResponse.json({ options });
  } catch (e) {
    return jsonError(e);
  }
}
