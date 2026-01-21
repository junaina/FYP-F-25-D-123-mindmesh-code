-- CreateTable
CREATE TABLE "public"."ProjectTaskBoard" (
    "projectId" UUID NOT NULL,
    "taskBoardId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTaskBoard_pkey" PRIMARY KEY ("projectId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTaskBoard_taskBoardId_key" ON "public"."ProjectTaskBoard"("taskBoardId");

-- CreateIndex
CREATE INDEX "ProjectTaskBoard_taskBoardId_idx" ON "public"."ProjectTaskBoard"("taskBoardId");

-- AddForeignKey
ALTER TABLE "public"."ProjectTaskBoard" ADD CONSTRAINT "ProjectTaskBoard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectTaskBoard" ADD CONSTRAINT "ProjectTaskBoard_taskBoardId_fkey" FOREIGN KEY ("taskBoardId") REFERENCES "public"."TaskBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
