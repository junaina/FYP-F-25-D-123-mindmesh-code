-- Ensure defaults exist for inserts (raw SQL inserts included)
ALTER TABLE public.rag_chunks
  ALTER COLUMN "createdAt" SET DEFAULT now(),
  ALTER COLUMN "updatedAt" SET DEFAULT now();
