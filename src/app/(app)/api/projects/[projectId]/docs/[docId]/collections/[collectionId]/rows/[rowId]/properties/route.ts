import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DocumentRepo, type DbValueUpdate } from "@/modules/documents/repo/document.repo"; // import the type
import { z } from "zod";

const createPropertyDto = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  value: z.any().optional(),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; docId: string; collectionId: string; rowId: string }> }
) {
  try {
    const { projectId, docId, collectionId, rowId } = await ctx.params;
    const body = createPropertyDto.parse(await req.json());

    // Validate that row belongs to this collection
    const item = await prisma.collectionItem.findFirst({
      where: { collectionId, documentId: rowId },
    });
    if (!item) {
      return NextResponse.json({ message: "Row not found in this collection" }, { status: 404 });
    }

    // 1. Create property definition
    const property = await DocumentRepo.createDef(projectId, body.name, body.type);

    // 2. Link this new property to all existing wikis (rows) in the collection
    const rows = await prisma.collectionItem.findMany({ where: { collectionId } });
    for (const row of rows) {
      await DocumentRepo.ensureLink(row.documentId, property.id);
    }

    // 3. If user provided an initial value, save it for this specific wiki
    if (body.value) {
      const data: DbValueUpdate = { // 👈 added type here
        valueString: null,
        valueNumber: null,
        valueBool: null,
        valueDate: null,
        valueJson: null,
        optionId: null,
      };

      if (body.type === "text") data.valueString = body.value;
      if (body.type === "checkbox") data.valueBool = body.value;
      if (body.type === "number") data.valueNumber = body.value;
      if (body.type === "date_time") data.valueDate = new Date(body.value);

      await DocumentRepo.upsertValue(rowId, property.id, data);
    }

    return NextResponse.json(property, { status: 201 });
  } catch (err) {
    console.error("[Add Property inside wiki] error:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
