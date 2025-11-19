-- CreateTable
CREATE TABLE "public"."MeetingSpeaker" (
    "id" UUID NOT NULL,
    "meetingId" UUID NOT NULL,
    "speakerIndex" INTEGER NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "MeetingSpeaker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingSpeaker_meetingId_idx" ON "public"."MeetingSpeaker"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingSpeaker_meetingId_speakerIndex_key" ON "public"."MeetingSpeaker"("meetingId", "speakerIndex");

-- AddForeignKey
ALTER TABLE "public"."MeetingSpeaker" ADD CONSTRAINT "MeetingSpeaker_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
