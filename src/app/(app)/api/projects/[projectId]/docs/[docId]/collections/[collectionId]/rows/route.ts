import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DocumentService } from "@/modules/documents/services/document.service";
import { requireUser } from "@/lib/auth";
import { PatchDocHeaderDto } from "@/modules/documents/dto/doc.dto";
import type { DocHeaderDto } from "@/modules/documents/dto/doc.dto";

const createRowDto = PatchDocHeaderDto.extend({
  title: z.string().min(1).default("Untitled"), // override default to always have title
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; docId: string; collectionId: string }> }
) {
  try {
    const { projectId, docId, collectionId } = await ctx.params;
    const body = createRowDto.parse(await req.json());

    const user = await requireUser();
    const userId = user.id;

    // 1. validate parent document
    const parentDoc = await prisma.document.findFirst({
      where: { id: docId, projectId },
    });
    if (!parentDoc) {
      return NextResponse.json({ message: "Parent document not found" }, { status: 404 });
    }

    // 2. validate collection
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, documentId: docId },
    });
    if (!collection) {
      return NextResponse.json({ message: "Collection not found in this document" }, { status: 404 });
    }

    // 3. create the row document (wiki row)
    const rowDoc = await prisma.document.create({
      data: {
        projectId,
        title: body.title,
        createdById: userId,
        content: {}, // start empty
      },
    });

    // 4. link to collection
    await prisma.collectionItem.create({
      data: {
        collectionId,
        documentId: rowDoc.id,
        addedById: userId,
      },
    });

    // 5. apply properties (if provided)
    if (body.properties) {
      await DocumentService.patchHeader(projectId, rowDoc.id, {
        properties: body.properties,
      });
    }

    // 6. return the full doc response (matches DocHeaderDto shape)
    const fullDoc = await DocumentService.getHeader(projectId, rowDoc.id);
    return NextResponse.json(fullDoc, { status: 201 });
  } catch (err) {
    console.error("[rows POST] error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation failed", issues: err.issues }, { status: 400 });
    }
    if ((err as any)?.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}

//getting alll the document 
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; docId: string; collectionId: string }> }
) {
  try {
    const { projectId, docId, collectionId } = await ctx.params;

    // 1️⃣ Validate parent document
    const parentDoc = await prisma.document.findFirst({
      where: { id: docId, projectId },
    });
    if (!parentDoc)
      return NextResponse.json({ message: "Parent document not found" }, { status: 404 });

    // 2️⃣ Validate collection
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, documentId: docId },
    });
    if (!collection)
      return NextResponse.json(
        { message: "Collection not found in this document" },
        { status: 404 }
      );

    // 3️⃣ Fetch all rows linked to this collection
    const collectionItems = await prisma.collectionItem.findMany({
      where: { collectionId },
    });

    // 4️⃣ Get all document headers (wikis)
    const rowDocs: DocHeaderDto[] = (
      await Promise.all(
        collectionItems.map((item) =>
          DocumentService.getHeader(projectId, item.documentId)
        )
      )
    ).filter((doc): doc is DocHeaderDto => doc !== null);

    // 5️⃣ Build a unique property map keyed by property ID (not name)
    const allProps = new Map<
      string,
      { id: string; name: string; type: string }
    >();

    for (const doc of rowDocs) {
      for (const p of doc.properties) {
        // Add property if not seen before
        if (!allProps.has(p.id)) {
          allProps.set(p.id, { id: p.id, name: p.name, type: p.type });
        }
        // If name/type changed later, ensure it's updated (rare, but consistent)
        else {
          const existing = allProps.get(p.id)!;
          if (existing.name !== p.name || existing.type !== p.type) {
            allProps.set(p.id, { id: p.id, name: p.name, type: p.type });
          }
        }
      }
    }

    // 6️⃣ Align all rows to include all properties
    const alignedRows = rowDocs.map((doc) => {
      const row: Record<string, any> = { id: doc.id, title: doc.title };

      for (const [, prop] of allProps) {
        const existing = doc.properties.find((p) => p.id === prop.id);

        // Always produce a consistent object shape
        if (existing?.value) {
          row[prop.name] = existing.value;
        } else {
          row[prop.name] = { type: prop.type, value: null };
        }
      }

      return row;
    });

    // 7️⃣ Produce ordered columns (by insertion order)
    const columns = Array.from(allProps.values()).map((p) => p.name);

    return NextResponse.json(
      {
        columns,
        rows: alignedRows,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[rows GET/all] error:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
