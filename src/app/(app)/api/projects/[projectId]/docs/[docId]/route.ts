import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  parseProjectDocParams,
  DocHeaderDto,
  parsePatchDocHeader,
} from "@/modules/documents/dto/doc.dto";
import { DocumentService } from "@/modules/documents/services/document.service";
type RouteParams = { params: { projectId: string; docId: string } }; //the second id is for docs

function jsonError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation Error", issue: err.issues },
      { status: 400 }
    );
  }
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { projectId, docId } = parseProjectDocParams(params);
    const data = await DocumentService.getHeader(projectId, docId); //service function that retrieves document header by id
    if (!data)
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(DocHeaderDto.parse(data)); //todo: implement DocHeaderDto
  } catch (err) {
    return jsonError(err);
  }
}
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { projectId, docId } = parseProjectDocParams(params);
    const body = parsePatchDocHeader(await req.json()); //todo: implement parsePatchDocHeader, it validates and parses the request body
    const updated = await DocumentService.patchHeader(projectId, docId, body); //service function that updates document header by id
    return NextResponse.json(updated);
  } catch (err) {
    return jsonError(err);
  }
}
