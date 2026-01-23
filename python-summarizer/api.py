#FAST API (stub for now)
import re
import time
from typing import Literal, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="python-summarizer (stub)", version="0.0.1")


# ---------- Contract (Phase 0) ----------

SummaryFormat = Literal["bullets", "paragraph"]


class SummarizeOptions(BaseModel):
    format: SummaryFormat = "bullets"
    maxTokens: int = Field(default=220, ge=32, le=2048)


class SummarizeRequest(BaseModel):
    meetingId: Optional[str] = None
    transcript: str = Field(min_length=1)
    options: SummarizeOptions = SummarizeOptions()


class SummarizeResponse(BaseModel):
    summary: str
    model: dict
    meta: dict


# ---------- Routes ----------

@app.get("/health")
def health():
    return {"ok": True, "service": "python-summarizer", "version": "0.0.1"}


def _normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _stub_summary(transcript: str, fmt: str) -> str:
    t = _normalize_ws(transcript)
    head = t[:500] + ("..." if len(t) > 500 else "")

    if fmt == "paragraph":
        return f"Summary (stub): {head}"

    return "\n".join(
        [
            "Summary (stub):",
            f"- Preview: {head}",
            "- Decisions: (stub) Not extracted yet",
            "- Action items: (stub) Not extracted yet",
        ]
    )


@app.post("/summarize", response_model=SummarizeResponse)
def summarize(req: SummarizeRequest):
    start = time.time()

    summary = _stub_summary(req.transcript, req.options.format)
    latency_ms = int((time.time() - start) * 1000)

    return SummarizeResponse(
        summary=summary,
        model={"name": "stub", "version": "0.0.1"},
        meta={"latencyMs": latency_ms, "charsIn": len(req.transcript)},
    )
