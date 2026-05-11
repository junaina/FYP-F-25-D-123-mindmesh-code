-- Ensure updatedAt gets a value on INSERTs (raw SQL + Python inserts)
ALTER TABLE public.rag_chunks
  ALTER COLUMN "updatedAt" SET DEFAULT now();
