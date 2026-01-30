# python-summarizer/rag/db.py
from __future__ import annotations

import os
from typing import Any, Dict, List, Tuple

import psycopg
from psycopg.rows import dict_row, DictRow

from typing import Optional
import math


def _get_db_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Put it in the repo root .env or export it in your shell."
        )
    return url


def get_conn() -> psycopg.Connection[Any]:
    # NOTE: don't set row_factory here; set it per-cursor to satisfy type checkers.
    return psycopg.connect(_get_db_url())


def fetch_project_documents(project_id: str) -> List[DictRow]:
    sql = """
      SELECT id, "projectId", title, content, "updatedAt"
      FROM "Document"
      WHERE "projectId" = %s
    """
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, (project_id,))
        return cur.fetchall()


def fetch_project_meetings(project_id: str) -> List[DictRow]:
    sql = """
      SELECT id, "projectId", transcript, "updatedAt"
      FROM "Meeting"
      WHERE "projectId" = %s
        AND transcript IS NOT NULL
        AND length(transcript) > 0
    """
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, (project_id,))
        return cur.fetchall()


def fetch_existing_chunk_hashes(
    project_id: str, source_type: str, source_id: str
) -> List[Tuple[int, str]]:
    sql = """
      SELECT "chunkIndex", "contentHash"
      FROM public.rag_chunks
      WHERE "projectId" = %s AND "sourceType" = %s AND "sourceId" = %s
      ORDER BY "chunkIndex" ASC
    """
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, (project_id, source_type, source_id))
        rows = cur.fetchall()
        return [(int(r["chunkIndex"]), str(r["contentHash"])) for r in rows]


def delete_source_chunks(
    conn: psycopg.Connection[Any], project_id: str, source_type: str, source_id: str
) -> int:
    sql = """
      DELETE FROM public.rag_chunks
      WHERE "projectId" = %s AND "sourceType" = %s AND "sourceId" = %s
    """
    with conn.cursor() as cur:
        cur.execute(sql, (project_id, source_type, source_id))
        return cur.rowcount


def insert_chunks(conn: psycopg.Connection[Any], rows: List[Dict[str, Any]]) -> None:
    sql = """
      INSERT INTO public.rag_chunks
        ("id","projectId","sourceType","sourceId","chunkIndex","contentText","contentHash","embedding")
      VALUES
        (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s)
    """
    with conn.cursor() as cur:
        for r in rows:
            cur.execute(
                sql,
                (
                    r["projectId"],
                    r["sourceType"],
                    r["sourceId"],
                    r["chunkIndex"],
                    r["contentText"],
                    r["contentHash"],
                    r["embedding"],
                ),
            )
def _to_pgvector_literal(vec: List[float]) -> str:
    """
    Converts a Python list[float] into a pgvector literal string: '[1,2,3]'.
    psycopg doesn't know pgvector by default, so we cast with ::vector in SQL.
    """
    cleaned: List[str] = []
    for x in vec:
        if x is None or isinstance(x, bool) or not isinstance(x, (int, float)):
            raise ValueError("Embedding contains a non-number value")
        if math.isnan(x) or math.isinf(x):
            raise ValueError("Embedding contains NaN/Inf")
        cleaned.append(f"{float(x):.10f}")
    return "[" + ",".join(cleaned) + "]"


def search_project_chunks(
    project_id: str,
    query_embedding: List[float],
    *,
    top_k: int = 6,
    source_type: Optional[str] = None,
    source_id: Optional[str] = None,
) -> List[DictRow]:
    """
    Returns top-k nearest chunks for a project (cosine distance via <=>).
    Optional filters: source_type ('DOCUMENT'/'MEETING') and/or specific source_id.
    """
    qv = _to_pgvector_literal(query_embedding)

    sql = """
      SELECT
        "sourceType",
        "sourceId",
        "chunkIndex",
        "contentText",
        (embedding <=> %s::vector) AS distance
      FROM public.rag_chunks
      WHERE "projectId" = %s
        AND (%s::text IS NULL OR "sourceType" = %s)
        AND (%s::text IS NULL OR "sourceId" = %s)
      ORDER BY embedding <=> %s::vector
      LIMIT %s
    """

    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            sql,
            (
                qv,
                project_id,
                source_type, source_type,
                source_id, source_id,
                qv,
                top_k,
            ),
        )
        return cur.fetchall()
