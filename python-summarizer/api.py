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



# ---------- Stage A: Extractive compression (CPU, deterministic) ----------

# Heuristic thresholdss
_EXTRACTIVE_THRESHOLD_CHARS = 6000  # below this, skip extractive
_EXTRACTIVE_KEEP_SENTENCES = 12     # stage-a compression size

def _should_use_extractive(cleaned_transcript: str) -> bool:
    return len(cleaned_transcript) > _EXTRACTIVE_THRESHOLD_CHARS


_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")

# Optional: remove "[mm:ss] Speaker X:" prefixes (works with your segment-built transcript too)
_TS_SPK_RE = re.compile(r"^\s*\[\d{2}:\d{2}\]\s*[^:]{1,40}:\s*", re.IGNORECASE)

def _clean_transcript_for_stage_a(text: str) -> str:
    # Keep it minimal: strip speaker/timestamp prefix per line + normalize whitespace
    out_lines = []
    for line in text.splitlines():
        s = line.strip()
        if not s:
            continue
        s = _TS_SPK_RE.sub("", s).strip()
        out_lines.append(s)
    return _normalize_ws(" ".join(out_lines))

def _split_sentences(text: str) -> list[str]:
    t = _normalize_ws(text)
    if not t:
        return []
    sents = _SENTENCE_SPLIT_RE.split(t)
    return [s.strip() for s in sents if len(s.strip()) >= 25]

def _score_sentence(s: str) -> float:
    lower = s.lower()
    score = 0.0

    # prefer medium-length sentences
    n = len(s)
    if 60 <= n <= 220:
        score += 1.2
    elif 30 <= n < 60:
        score += 0.6
    elif n > 220:
        score += 0.3

    keywords = (
        "decision","decided","agree","agreed","action","todo","next",
        "plan","deadline","blocker","issue","fix","owner","follow up",
    )
    for k in keywords:
        if k in lower:
            score += 0.7

    # de-prioritize obvious counting/mic-check style
    if re.search(r"\bone,\s*two,\s*three\b", lower) or re.search(r"\b1,\s*2,\s*3\b", lower):
        score -= 1.5

    return score

def _extractive_digest(transcript: str, keep_sentences: int = 10) -> list[str]:
    sents = _split_sentences(transcript)
    if not sents:
        return []
    scored = [(i, _score_sentence(sents[i])) for i in range(len(sents))]
    top = sorted(scored, key=lambda x: x[1], reverse=True)[: max(1, keep_sentences)]
    idxs = sorted(i for i, _ in top)
    return [sents[i] for i in idxs]
def _fallback_summary_stub(transcript: str, fmt: str, *, digest: list[str] | None = None) -> str:
    """
    Leaf fallback. It can optionally include Stage A digest for testing today.
    Later, when Stage B becomes real model inference, this stays as the fallback only.
    """
    t = _normalize_ws(transcript)
    head = t[:500] + ("..." if len(t) > 500 else "")

    if fmt == "paragraph":
        if digest:
            return f"Summary (stub): {head}\n\nExtractive digest (Stage A): " + " ".join(digest[:5])
        return f"Summary (stub): {head}"

    lines = [
        "Summary (stub):",
        f"- Preview: {head}",
        "- Decisions: (stub) Not extracted yet",
        "- Action items: (stub) Not extracted yet",
    ]

    if digest:
        lines.append("- Extractive digest (Stage A):")
        for s in digest:
            lines.append(f"  - {s}")

    return "\n".join(lines)



#will replace this with model inference later

def _abstractive_summary(transcript: str, fmt: str, max_tokens: int) -> str:
    """
    Stage B entrypoint.

    TODAY: still stubbed.
    LATER: replace the body of this function with infer.py model inference.
    """
    # TODO: replace with model inference later
    return _fallback_summary_stub(transcript, fmt)


def _summarize_pipeline(transcript: str, fmt: str, max_tokens: int) -> str:
    """
    Orchestrates Stage A (optional) + Stage B (abstractive).
    Keeps contracts unchanged. Lets you test Stage A now without breaking anything.
    """
    cleaned = _clean_transcript_for_stage_a(transcript)
    use_a = _should_use_extractive(cleaned)

    if use_a:
        digest = _extractive_digest(cleaned, keep_sentences=_EXTRACTIVE_KEEP_SENTENCES)

        # IMPORTANT:
        # For now, Stage B is stub, so we return stub + digest for visibility/testing.
        # When Stage B becomes real, you'll likely do:
        #   stage_b_input = "\n".join(digest)
        #   return _abstractive_summary(stage_b_input, fmt, max_tokens)
        return _fallback_summary_stub(transcript, fmt, digest=digest)

    # Small transcript: skip extractive; go straight to Stage B.
    return _abstractive_summary(cleaned or transcript, fmt, max_tokens)

@app.post("/summarize", response_model=SummarizeResponse)
def summarize(req: SummarizeRequest):
    start = time.time()

    summary = _summarize_pipeline(req.transcript, req.options.format, req.options.maxTokens)

    latency_ms = int((time.time() - start) * 1000)

    return SummarizeResponse(
        summary=summary,
        model={"name": "stub", "version": "0.0.1"},
        meta={"latencyMs": latency_ms, "charsIn": len(req.transcript)},
    )
