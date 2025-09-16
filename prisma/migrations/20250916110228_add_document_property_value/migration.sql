-- CreateTable
CREATE TABLE "public"."DocumentPropertyValue" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "valueString" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueBool" BOOLEAN,
    "valueDate" TIMESTAMP(3),
    "valueJson" JSONB,
    "optionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentPropertyValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentPropertyValue_documentId_idx" ON "public"."DocumentPropertyValue"("documentId");

-- CreateIndex
CREATE INDEX "DocumentPropertyValue_propertyId_idx" ON "public"."DocumentPropertyValue"("propertyId");

-- CreateIndex
CREATE INDEX "DocumentPropertyValue_optionId_idx" ON "public"."DocumentPropertyValue"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentPropertyValue_documentId_propertyId_key" ON "public"."DocumentPropertyValue"("documentId", "propertyId");

-- AddForeignKey
ALTER TABLE "public"."DocumentPropertyValue" ADD CONSTRAINT "DocumentPropertyValue_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPropertyValue" ADD CONSTRAINT "DocumentPropertyValue_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."PropertyOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPropertyValue" ADD CONSTRAINT "DocumentPropertyValue_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."PropertyDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
