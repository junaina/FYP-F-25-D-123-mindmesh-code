CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RagSourceType') THEN
    CREATE TYPE "public"."RagSourceType" AS ENUM ('DOCUMENT', 'MEETING', 'FILE');
  END IF;
END $$;

-- CreateTable
CREATE TABLE "public"."rag_chunks" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "sourceType" "public"."RagSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "contentText" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rag_chunks_projectId_idx" ON "public"."rag_chunks"("projectId");

-- CreateIndex
CREATE INDEX "rag_chunks_projectId_sourceType_idx" ON "public"."rag_chunks"("projectId", "sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "rag_chunks_projectId_sourceType_sourceId_chunkIndex_key" ON "public"."rag_chunks"("projectId", "sourceType", "sourceId", "chunkIndex");

-- Recommended index for real use (HNSW is great for pgvector if supported on your Neon version)
CREATE INDEX IF NOT EXISTS "rag_chunks_embedding_hnsw"
ON "public"."rag_chunks" USING hnsw ("embedding" vector_cosine_ops);


-- AddForeignKey
ALTER TABLE "public"."rag_chunks" ADD CONSTRAINT "rag_chunks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
