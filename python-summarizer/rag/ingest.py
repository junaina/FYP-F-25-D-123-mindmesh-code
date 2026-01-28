# python-summarizer/rag/ingest.py
from __future__ import annotations
import hashlib
import json
from typing import Any, Dict, List, Tuple

from .db import (
    get_conn,
    fetch_project_documents,
    fetch_project_meetings,
    fetch_existing_chunk_hashes,
    delete_source_chunks,
    insert_chunks,
)
from .tiptap_to_text import tiptap_to_text
from .chunking import chunk_text
from .embeddings import embed_texts

def sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def compute_chunk_hashes(chunks: List[str]) -> List[str]:
    return [sha256(c) for c in chunks]

def is_unchanged(existing: List[Tuple[int, str]], new_hashes: List[str]) -> bool:
    if len(existing) != len(new_hashes):
        return False
    for (idx, h), new_h in zip(existing, new_hashes):
        if idx != new_hashes.index(new_h):  # (safe but O(n); we’ll do better below)
            pass
    # better:
    for i, (_, h) in enumerate(existing):
        if h != new_hashes[i]:
            return False
    return True

def index_project(project_id: str, *, chunk_size: int = 1000, overlap: int = 150) -> Dict[str, Any]:
    docs = fetch_project_documents(project_id)
    meets = fetch_project_meetings(project_id)

    stats = {
        "projectId": project_id,
        "documentsTotal": len(docs),
        "meetingsTotal": len(meets),
        "sourcesIndexed": 0,
        "sourcesSkipped": 0,
        "chunksInserted": 0,
    }

    # We do per-source transactions so one bad doc doesn’t kill everything.
    for d in docs:
        source_type = "DOCUMENT"
        source_id = str(d["id"])

        # TipTap JSON -> text
        content_json = d.get("content")
        text = ""
        if content_json:
            # content_json might already be dict or a JSON string depending on driver
            if isinstance(content_json, str):
                content_json = json.loads(content_json)
            text = tiptap_to_text(content_json)

        text = text.strip()
        if not text:
            continue

        chunks = chunk_text(text, chunk_size=chunk_size, overlap=overlap)
        new_hashes = compute_chunk_hashes(chunks)
        existing = fetch_existing_chunk_hashes(project_id, source_type, source_id)

        if len(existing) > 0 and is_unchanged(existing, new_hashes):
            stats["sourcesSkipped"] += 1
            continue

        vectors = embed_texts(chunks)

        rows = []
        for i, (c, h, v) in enumerate(zip(chunks, new_hashes, vectors)):
            rows.append({
                "projectId": project_id,
                "sourceType": source_type,
                "sourceId": source_id,
                "chunkIndex": i,
                "contentText": c,
                "contentHash": h,
                "embedding": v,
            })

        with get_conn() as conn:
            with conn.transaction():
                delete_source_chunks(conn, project_id, source_type, source_id)
                insert_chunks(conn, rows)

        stats["sourcesIndexed"] += 1
        stats["chunksInserted"] += len(rows)

    for m in meets:
        source_type = "MEETING"
        source_id = str(m["id"])

        text = (m.get("transcript") or "").strip()
        if not text:
            continue

        chunks = chunk_text(text, chunk_size=chunk_size, overlap=overlap)
        new_hashes = compute_chunk_hashes(chunks)
        existing = fetch_existing_chunk_hashes(project_id, source_type, source_id)

        if len(existing) > 0 and is_unchanged(existing, new_hashes):
            stats["sourcesSkipped"] += 1
            continue

        vectors = embed_texts(chunks)

        rows = []
        for i, (c, h, v) in enumerate(zip(chunks, new_hashes, vectors)):
            rows.append({
                "projectId": project_id,
                "sourceType": source_type,
                "sourceId": source_id,
                "chunkIndex": i,
                "contentText": c,
                "contentHash": h,
                "embedding": v,
            })

        with get_conn() as conn:
            with conn.transaction():
                delete_source_chunks(conn, project_id, source_type, source_id)
                insert_chunks(conn, rows)

        stats["sourcesIndexed"] += 1
        stats["chunksInserted"] += len(rows)

    return stats
