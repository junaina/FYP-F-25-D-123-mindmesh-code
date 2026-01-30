from __future__ import annotations

import hashlib
import re
from typing import Any, Dict, List, Tuple

from .chunking import chunk_text
from .db import (
    get_conn,
    fetch_project_documents,
    fetch_project_meetings,
    fetch_existing_chunk_hashes,
    delete_source_chunks,
    insert_chunks,
)
from .embeddings import embed_texts
from .tiptap_to_text import tiptap_to_text


# ---- Tuning knobs ----
MIN_CHUNK_CHARS = 20         # skip junk like "that's"
MEETING_MIN_CHARS = 120      # meetings tend to be noisier; keep a bit higher if you want
BATCH_EMBED = 32             # embedding batch size (safe for CPU; OpenAI runs remotely)


# ---- Transcript cleanup ----
_MIC_CHECK_PATTERNS = [
    r"^\s*mic\s*check\b",
    r"^\s*sound\s*check\b",
    r"^\s*testing\b",
    r"^\s*test\s+test\b",
    r"^\s*hello\b(?:\s+\w+){0,3}\s*$",
    r"^\s*(one|two|three|four|five|six|seven|eight|nine|ten|\d+)(\s*[,\- ]\s*(one|two|three|four|five|six|seven|eight|nine|ten|\d+))*\s*$",
]
_MIC_CHECK_RE = re.compile("|".join(_MIC_CHECK_PATTERNS), re.IGNORECASE)


def clean_meeting_transcript(raw: str) -> str:
    """Drop obvious mic-check / counting lines and collapse whitespace."""
    if not raw:
        return ""
    lines = [ln.strip() for ln in raw.splitlines()]
    lines = [ln for ln in lines if ln]
    lines = [ln for ln in lines if not _MIC_CHECK_RE.match(ln)]
    return "\n".join(lines).strip()


def sha256_text(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def _chunks_for_source(text: str, *, chunk_size: int, overlap: int, min_chars: int) -> List[str]:
    """Chunk + normalize + drop tiny chunks."""
    chunks = chunk_text(text, chunk_size=chunk_size, overlap=overlap)
    chunks = [c.strip() for c in chunks]
    chunks = [c for c in chunks if len(c) >= min_chars]
    return chunks


def _embed_in_batches(texts: List[str]) -> List[List[float]]:
    """Embed in small batches to avoid payload limits / keep it stable."""
    out: List[List[float]] = []
    for i in range(0, len(texts), BATCH_EMBED):
        batch = texts[i : i + BATCH_EMBED]
        out.extend(embed_texts(batch))
    return out


def index_project(project_id: str, *, chunk_size: int = 1000, overlap: int = 150) ->  dict[str, str | int]:

    """
    Index project-scoped DOCUMENT and MEETING sources into public.rag_chunks.

    Strategy:
    - Extract text
    - Chunk + filter (skip tiny/junk)
    - Compute chunk hashes
    - If unchanged vs existing hashes -> skip
    - Else delete old chunks for that source and insert new ones

    Returns stats matching your Goal 2 output.
    """
    docs = fetch_project_documents(project_id)
    meetings = fetch_project_meetings(project_id)

    stats: Dict[str, int] = {
        "documentsTotal": len(docs),
        "meetingsTotal": len(meetings),
        "sourcesIndexed": 0,
        "sourcesSkipped": 0,
        "chunksInserted": 0,
    }

    # ---- DOCUMENTS ----
    for d in docs:
        source_type = "DOCUMENT"
        source_id = str(d["id"])  # stored as text in rag_chunks.sourceId

        # TipTap JSON -> text
        raw_content = d.get("content")
        text = tiptap_to_text(raw_content).strip() if raw_content is not None else ""
        if not text:
            # no content: ensure we remove any existing chunks for this doc
            with get_conn() as conn:
                with conn.transaction():
                    delete_source_chunks(conn, project_id, source_type, source_id)
            stats["sourcesIndexed"] += 1
            continue

        chunks = _chunks_for_source(text, chunk_size=chunk_size, overlap=overlap, min_chars=MIN_CHUNK_CHARS)
        if not chunks:
            # only tiny/noisy content; delete existing and move on
            with get_conn() as conn:
                with conn.transaction():
                    delete_source_chunks(conn, project_id, source_type, source_id)
            stats["sourcesIndexed"] += 1
            continue

        new_hashes: List[str] = [sha256_text(c) for c in chunks]
        existing = fetch_existing_chunk_hashes(project_id, source_type, source_id)
        existing_hashes = [h for _, h in existing]

        if existing_hashes == new_hashes:
            stats["sourcesSkipped"] += 1
            continue

        embeddings = _embed_in_batches(chunks)

        rows: List[Dict[str, Any]] = []
        for idx, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            rows.append(
                {
                    "projectId": project_id,
                    "sourceType": source_type,
                    "sourceId": source_id,
                    "chunkIndex": idx,
                    "contentText": chunk,
                    "contentHash": new_hashes[idx],
                    "embedding": emb,
                }
            )

        with get_conn() as conn:
            with conn.transaction():
                delete_source_chunks(conn, project_id, source_type, source_id)
                insert_chunks(conn, rows)

        stats["sourcesIndexed"] += 1
        stats["chunksInserted"] += len(rows)

    # ---- MEETINGS ----
    for m in meetings:
        source_type = "MEETING"
        source_id = str(m["id"])

        raw_t = (m.get("transcript") or "")
        text = clean_meeting_transcript(raw_t)
        if not text:
            with get_conn() as conn:
                with conn.transaction():
                    delete_source_chunks(conn, project_id, source_type, source_id)
            stats["sourcesIndexed"] += 1
            continue

        chunks = _chunks_for_source(text, chunk_size=chunk_size, overlap=overlap, min_chars=MEETING_MIN_CHARS)
        if not chunks:
            with get_conn() as conn:
                with conn.transaction():
                    delete_source_chunks(conn, project_id, source_type, source_id)
            stats["sourcesIndexed"] += 1
            continue

        new_hashes: List[str] = [sha256_text(c) for c in chunks]
        existing = fetch_existing_chunk_hashes(project_id, source_type, source_id)
        existing_hashes = [h for _, h in existing]

        if existing_hashes == new_hashes:
            stats["sourcesSkipped"] += 1
            continue

        embeddings = _embed_in_batches(chunks)

        rows: List[Dict[str, Any]] = []
        for idx, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            rows.append(
                {
                    "projectId": project_id,
                    "sourceType": source_type,
                    "sourceId": source_id,
                    "chunkIndex": idx,
                    "contentText": chunk,
                    "contentHash": new_hashes[idx],
                    "embedding": emb,
                }, 
            )
            
        with get_conn() as conn:
            with conn.transaction():
                delete_source_chunks(conn, project_id, source_type, source_id)
                insert_chunks(conn, rows)

        stats["sourcesIndexed"] += 1
        stats["chunksInserted"] += len(rows)
    
    return {
        "projectId": project_id,
        **stats,
    }
