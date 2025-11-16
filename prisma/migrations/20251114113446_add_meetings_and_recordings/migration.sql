-- CreateTable
CREATE TABLE "public"."MeetingSegment" (
    "id" UUID NOT NULL,
    "meetingId" UUID NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "speakerIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "MeetingSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingSegment_meetingId_idx" ON "public"."MeetingSegment"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingSegment_speakerIndex_idx" ON "public"."MeetingSegment"("speakerIndex");

-- AddForeignKey
ALTER TABLE "public"."MeetingSegment" ADD CONSTRAINT "MeetingSegment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
