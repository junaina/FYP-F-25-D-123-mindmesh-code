// src/app/api/projects/[projectId]/docs/[docId]/collections/[collectionId]/properties/route.ts here i am creating the ADD PROPERTY THING THAT WILL BE (+) MEANS YOU CAN ADD PROPERTYTYPE 

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DocumentRepo } from "@/modules/documents/repo/document.repo";
import { z } from "zod";

// body schema — name & type are required
const createPropertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  type: z.string().min(1, "Property type is required"),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; docId: string; collectionId: string }> }
) {
  try {
    const { projectId, docId, collectionId } = await ctx.params;
    const body = createPropertySchema.parse(await req.json());

    //  Step 1: ensure collection exists in this document
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, documentId: docId },
    });
    if (!collection) {
      return NextResponse.json(
        { message: "Collection not found in this document" },
        { status: 404 }
      );
    }

    // Step 2: create the property definition (column)
    const property = await DocumentRepo.createDef(projectId, body.name, body.type);

    // Step 3: link this new property to ALL existing rows (wikis) in the collection
    const rows = await prisma.collectionItem.findMany({ where: { collectionId } });
    for (const row of rows) {
      await DocumentRepo.ensureLink(row.documentId, property.id);
    }

    // Step 4: return the new column definition
    return NextResponse.json(
      {
        message: "Property created and linked to all rows",
        property,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Add Property Column] error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", issues: err.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
