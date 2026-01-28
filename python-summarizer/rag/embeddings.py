# python-summarizer/rag/embeddings.py
from __future__ import annotations
import os
from typing import List
from openai import OpenAI
EMBED_MODEL = os.getenv("RAG_EMBED_MODEL", "text-embedding-3-small")
EMBED_DIM = int(os.getenv("RAG_EMBED_DIM", "1536"))
OPENAI_API_KEY = os.environ["OPENAI_API_KEY_RAG"]
client = OpenAI(api_key=OPENAI_API_KEY)

CHAT_MODEL = os.getenv("RAG_CHAT_MODEL", "gpt-4o-mini")
CHAT_TEMPERATURE = float(os.getenv("RAG_CHAT_TEMPERATURE", "0.2"))
CHAT_MAX_TOKENS = int(os.getenv("RAG_CHAT_MAX_TOKENS", "500"))
def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Returns list of embedding vectors (len = EMBED_DIM each).
    Requires: pip install openai
    Env: OPENAI_API_KEY_RAG
    """

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY_RAG"])

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


def call_chat_rag(*, query: str, context: str) -> str:
    """
    RAG chat: answer the query ONLY using the provided context.
    The context already contains citation tags like:
      [DOCUMENT:<sourceId>#<chunkIndex>] ...
    We instruct the model to cite using those tags.
    """
    if not context.strip():
        return "I couldn’t find relevant context in the indexed knowledge base."

    system = (
        "You are a retrieval-augmented assistant.\n"
        "Answer the user's question using ONLY the provided context.\n"
        "If the answer is not in the context, give the best estimate from the sources on the internet and specify that you couldn't find answers in the context.\n"
        "When you use facts from the context, include citations using the exact bracket tags "
        "already present in the context (e.g., [DOCUMENT:...#0], [MEETING:...#2]).\n"
        "Be concise but complete."
    )

    user = f"Question:\n{query}\n\nContext:\n{context}"

    resp = client.chat.completions.create(
        model=CHAT_MODEL,
        temperature=CHAT_TEMPERATURE,
        max_tokens=CHAT_MAX_TOKENS,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )

    msg = resp.choices[0].message.content or ""
    return msg.strip()