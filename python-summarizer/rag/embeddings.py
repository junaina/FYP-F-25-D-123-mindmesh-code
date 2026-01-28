# python-summarizer/rag/embeddings.py
from __future__ import annotations
import os
from typing import List
from openai import OpenAI
EMBED_MODEL = os.getenv("RAG_EMBED_MODEL", "text-embedding-3-small")
EMBED_DIM = int(os.getenv("RAG_EMBED_DIM", "1536"))

def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Returns list of embedding vectors (len = EMBED_DIM each).
    Requires: pip install openai
    Env: OPENAI_API_KEY
    """

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    # batch call
    resp = client.embeddings.create(
        model=EMBED_MODEL,
        input=texts,
    )

    vectors = [item.embedding for item in resp.data]

    # guardrail: fail fast if model dims mismatch
    for v in vectors:
        if len(v) != EMBED_DIM:
            raise RuntimeError(f"Embedding dim mismatch: got {len(v)}, expected {EMBED_DIM}")
    return vectors
