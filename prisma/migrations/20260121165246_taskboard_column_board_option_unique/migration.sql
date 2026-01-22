/*
  Warnings:

  - A unique constraint covering the columns `[taskBoardId,optionId]` on the table `TaskBoardColumn` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TaskBoardColumn_taskBoardId_optionId_key" ON "public"."TaskBoardColumn"("taskBoardId", "optionId");
