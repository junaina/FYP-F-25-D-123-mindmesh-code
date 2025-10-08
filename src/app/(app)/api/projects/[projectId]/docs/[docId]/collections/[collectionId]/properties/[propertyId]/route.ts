import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DocumentRepo } from "@/modules/documents/repo/document.repo";
import { z } from "zod";
import type { PropertyType } from "@/modules/documents/domain/types";
import { PROPERTY_TYPES } from "@/modules/documents/domain/types";

// ✅ Define Zod schema for request validation
const updatePropertySchema = z.object({
  name: z.string().optional(),
  type: z.enum(PROPERTY_TYPES).optional(),
  dropOptionsOnTypeChange: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; docId: string; collectionId: string; propertyId: string }> }
) {
  try {
    const { projectId, docId, collectionId, propertyId } = await ctx.params;
    const body = updatePropertySchema.parse(await req.json());

    // 1️⃣ Verify the collection belongs to this document
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, documentId: docId },
    });
    if (!collection)
      return NextResponse.json({ message: "Collection not found in this document" }, { status: 404 });

    // 2️⃣ Fetch current property definition
    const current = await prisma.propertyDefinition.findFirst({
      where: { id: propertyId, projectId },
      include: { options: true },
    });
    if (!current)
      return NextResponse.json({ message: "Property not found in this project" }, { status: 404 });

    // 3️⃣ Determine the type transition
    const fromType = (current.type as PropertyType);
    const toType = (body.type ?? fromType) as PropertyType;

    // 4️⃣ If only name is changing (no type change)
    if (fromType === toType) {
      const updated = await prisma.propertyDefinition.update({
        where: { id: propertyId },
        data: { name: body.name ?? current.name },
        include: { options: true },
      });
      return NextResponse.json(updated, { status: 200 });
    }

    // 5️⃣ Handle full type change with cleanup
    const updated = await DocumentRepo.txUpdatePropertyDefinition({
      projectId,
      propertyId,
      updateBasics: { name: body.name ?? current.name, type: toType },
      fromType,
      toType,
      keepField:
        toType === "text"
          ? "valueString"
          : toType === "number"
          ? "valueNumber"
          : toType === "checkbox"
          ? "valueBool"
          : toType === "date_time"
          ? "valueDate"
          : ["multi_select", "person", "file"].includes(toType)
          ? "valueJson"
          : ["select", "status"].includes(toType)
          ? "optionId"
          : "valueString",
    });

    // 6️⃣ If user asked to drop old options on type change
    if (body.dropOptionsOnTypeChange && fromType !== toType) {
      await prisma.propertyOption.deleteMany({ where: { propertyId } });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("[PATCH property type] error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation failed", issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
