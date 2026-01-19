-- CreateEnum
CREATE TYPE "public"."FileStatus" AS ENUM ('PENDING', 'UPLOADED', 'ATTACHED', 'DELETED');

-- DropForeignKey
ALTER TABLE "public"."MessageAttachment" DROP CONSTRAINT "MessageAttachment_fileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MessageAttachment" DROP CONSTRAINT "MessageAttachment_messageId_fkey";

-- AlterTable
ALTER TABLE "public"."File" ADD COLUMN     "deletedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "public"."FileStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "uploadedAt" TIMESTAMP(3),
ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Message" ALTER COLUMN "body" SET DEFAULT '';

-- AlterTable
ALTER TABLE "public"."MessageAttachment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "position" INTEGER;

-- CreateIndex
CREATE INDEX "MessageAttachment_messageId_idx" ON "public"."MessageAttachment"("messageId");

-- CreateIndex
CREATE INDEX "MessageAttachment_fileId_idx" ON "public"."MessageAttachment"("fileId");

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
