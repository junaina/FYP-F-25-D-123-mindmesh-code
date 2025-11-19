-- CreateEnum
CREATE TYPE "public"."MeetingStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "public"."MeetingRecordingStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."Meeting" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "livekitRoomName" TEXT NOT NULL,
    "status" "public"."MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "hasRecording" BOOLEAN NOT NULL DEFAULT false,
    "hasTranscript" BOOLEAN NOT NULL DEFAULT false,
    "transcript" TEXT,
    "transcriptCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MeetingRecording" (
    "id" UUID NOT NULL,
    "meetingId" UUID NOT NULL,
    "egressId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "status" "public"."MeetingRecordingStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingRecording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_joinCode_key" ON "public"."Meeting"("joinCode");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_livekitRoomName_key" ON "public"."Meeting"("livekitRoomName");

-- CreateIndex
CREATE INDEX "Meeting_projectId_idx" ON "public"."Meeting"("projectId");

-- CreateIndex
CREATE INDEX "Meeting_createdById_idx" ON "public"."Meeting"("createdById");

-- CreateIndex
CREATE INDEX "Meeting_projectId_createdAt_idx" ON "public"."Meeting"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "MeetingRecording_meetingId_idx" ON "public"."MeetingRecording"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingRecording_egressId_idx" ON "public"."MeetingRecording"("egressId");

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeetingRecording" ADD CONSTRAINT "MeetingRecording_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
