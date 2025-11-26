"""
High-level meeting summarization pipeline.

Stage A: extractive compression via sentence-transformers + TextRank
Stage B: abstractive summarization via fine-tuned T5

Public function:
    summarize_transcript(transcript: str) -> str
"""

from typing import Optional

from models.extractive import textrank_summarize
from models.t5_summarizer import (
    load_t5_model,
    chunk_by_tokens,
    summarize_chunk,
)


def summarize_transcript(
    transcript: str,
    *,
    max_extractive_sentences: int = 40,
    max_chunk_input_tokens: int = 512,
    max_chunk_output_tokens: int = 128,
    final_pass_max_tokens: int = 256,
    model_dir: Optional[str] = None,
) -> str:
    """
    1) Stage A: extract ~40 key sentences (TextRank)
    2) Stage B:
       - chunk compressed text if still long
       - summarize each chunk with T5
       - summarize combined chunk summaries
    """
    transcript = (transcript or "").strip()
    if not transcript:
        return ""

    # --- Stage A: extractive ---
    stage_a_sentences = textrank_summarize(
        transcript, max_sentences=max_extractive_sentences
    )
    if not stage_a_sentences:
        stage_a_text = transcript  # fallback
    else:
        stage_a_text = " ".join(stage_a_sentences)

    # --- Stage B: abstractive with chunking ---
    _, tokenizer = load_t5_model(model_dir)

    chunks = chunk_by_tokens(
        stage_a_text,
        tokenizer,
        max_tokens=max_chunk_input_tokens,
    )

    if len(chunks) == 1:
        # Simple case: single chunk
        return summarize_chunk(
            chunks[0],
            model_dir=model_dir,
            max_input_tokens=max_chunk_input_tokens,
            max_output_tokens=final_pass_max_tokens,
        )

    # Many chunks: summarize each, then final pass
    intermediate_summaries = [
        summarize_chunk(
            chunk,
            model_dir=model_dir,
            max_input_tokens=max_chunk_input_tokens,
            max_output_tokens=max_chunk_output_tokens,
        )
        for chunk in chunks
    ]

    combined = " ".join(intermediate_summaries)

    final_summary = summarize_chunk(
        combined,
        model_dir=model_dir,
        max_input_tokens=max_chunk_input_tokens,
        max_output_tokens=final_pass_max_tokens,
    )

    return final_summary
