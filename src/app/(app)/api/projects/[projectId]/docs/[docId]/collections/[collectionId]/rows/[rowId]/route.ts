// src/app/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/rows/[rowId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DocumentService } from "@/modules/documents/services/document.service";
import { z } from "zod";
import { PatchDocHeaderDto } from "@/modules/documents/dto/doc.dto";

//gteting each wiki and its content
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; docId: string; collectionId: string; rowId: string }> }
) {
  try {
    const { projectId, docId, collectionId, rowId } = await ctx.params;

    // validate parent doc
    const parentDoc = await prisma.document.findFirst({ where: { id: docId, projectId } });
    if (!parentDoc) return NextResponse.json({ message: "Parent document not found" }, { status: 404 });

    // validate collection
    const collection = await prisma.collection.findFirst({ where: { id: collectionId, documentId: docId } });
    if (!collection) return NextResponse.json({ message: "Collection not found in this document" }, { status: 404 });

    // validate row belongs to collection
    const collectionItem = await prisma.collectionItem.findFirst({
      where: { collectionId, documentId: rowId },
    });
    if (!collectionItem) return NextResponse.json({ message: "Row not found in this collection" }, { status: 404 });

    // fetch row doc header
    const rowDoc = await DocumentService.getHeader(projectId, rowId);
    return NextResponse.json(rowDoc, { status: 200 });
  } catch (err) {
    console.error("[rows GET/:id] error:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}


//updating wiki content and wiki name and this will result in updation of whole table content and when i call GET /api/projects/:projectId/docs/:docId/collections/:collectionId/rows then i will be able to see the updated wikii
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; docId: string; collectionId: string; rowId: string }> }
) {
  try {
    const { projectId, docId, collectionId, rowId } = await ctx.params;
    const body = PatchDocHeaderDto.parse(await req.json());

    // Validate parent doc
    const parentDoc = await prisma.document.findFirst({
      where: { id: docId, projectId },
    });
    if (!parentDoc)
      return NextResponse.json({ message: "Parent document not found" }, { status: 404 });

    // Validate collection
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, documentId: docId },
    });
    if (!collection)
      return NextResponse.json({ message: "Collection not found in this document" }, { status: 404 });

    // Validate that row belongs to this collection
    const item = await prisma.collectionItem.findFirst({
      where: { collectionId, documentId: rowId },
    });
    if (!item)
      return NextResponse.json({ message: "Row not found in this collection" }, { status: 404 });

    // Perform the update using DocumentService
    const updated = await DocumentService.patchHeader(projectId, rowId, body);

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("[rows PATCH/:id] error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation failed", issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
