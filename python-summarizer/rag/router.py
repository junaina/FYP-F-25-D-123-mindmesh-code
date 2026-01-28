from fastapi import APIRouter, HTTPException
from .models import (
    IndexProjectRequest,
    IndexProjectResponse,
    QueryProjectRequest,
    QueryProjectResponse,
    RetrievedChunk,
    AnswerProjectRequest,
    AnswerProjectResponse,
    Citation
)
from .ingest import index_project
from .embeddings import embed_texts, call_chat_rag

from .db import search_project_chunks

router = APIRouter()

@router.post("/index_project", response_model=IndexProjectResponse)
def index_project_route(body: IndexProjectRequest):
    try:
        stats = index_project(
            body.projectId,
            chunk_size=body.chunkSize,
            overlap=body.overlap,
        )
        return stats
    except KeyError as e:
        # missing env vars like DATABASE_URL or OPENAI_API_KEY_RAG
        raise HTTPException(status_code=500, detail=f"Missing env var: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/query_project", response_model=QueryProjectResponse)
def query_project_route(body: QueryProjectRequest):
    try:
        # Embed query (remote call to OpenAI; CPU is fine)
        qvec = embed_texts([body.query])[0]

        rows = search_project_chunks(
            body.projectId,
            qvec,
            top_k=body.topK,
            source_type=body.sourceType,
            source_id=body.sourceId,
        )

        results = [
            RetrievedChunk(
                sourceType=str(r["sourceType"]),
                sourceId=str(r["sourceId"]),
                chunkIndex=int(r["chunkIndex"]),
                contentText=str(r["contentText"]),
                distance=float(r["distance"]),
            )
            for r in rows
        ]

        return QueryProjectResponse(
            projectId=body.projectId,
            query=body.query,
            topK=body.topK,
            results=results,
        )

    except KeyError as e:
        raise HTTPException(status_code=500, detail=f"Missing env var: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/answer_project", response_model=AnswerProjectResponse)
def answer_project_route(body: AnswerProjectRequest):
    try:
        qvec = embed_texts([body.query])[0]
        rows = search_project_chunks(
            body.projectId,
            qvec,
            top_k=body.topK,
            source_type=body.sourceType,
            source_id=body.sourceId,
        )

        # Filter tiny chunks
        filtered = [
            r for r in rows
            if isinstance(r.get("contentText"), str) and len(r["contentText"].strip()) >= body.minChars
        ]

        # Build context block
        context_lines = []
        citations = []
        for r in filtered:
            st = str(r["sourceType"])
            sid = str(r["sourceId"])
            ci = int(r["chunkIndex"])
            dist = float(r["distance"])
            txt = str(r["contentText"]).strip()

            citations.append(Citation(sourceType=st, sourceId=sid, chunkIndex=ci, distance=dist))
            context_lines.append(f"[{st}:{sid}#{ci}] {txt}")

        context = "\n\n".join(context_lines) if context_lines else ""

        # If no context, return safe response
        if not context:
            return AnswerProjectResponse(
                projectId=body.projectId,
                query=body.query,
                answer="I couldn’t find relevant context in this project’s indexed documents/meetings.",
                citations=[],
            )

        # Call LLM (you’ll implement call_chat() in embeddings.py or a new llm.py)
        answer = call_chat_rag(query=body.query, context=context)

        return AnswerProjectResponse(
            projectId=body.projectId,
            query=body.query,
            answer=answer,
            citations=citations,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
