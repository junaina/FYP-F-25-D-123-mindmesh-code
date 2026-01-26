"""
infer.py — load a fine-tuned seq2seq model and produce a paragraph summary.

This will be used by FastAPI later. For now it also supports a simple CLI smoke test.
"""
import sys
import argparse
import re
from functools import lru_cache
from typing import Optional

import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM


def _normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+")


def _dedupe_sentences(text: str) -> str:
    """Remove repeated sentences so repeated digests don't cause echo-y outputs."""
    sents = [s.strip() for s in _SENT_SPLIT.split(_normalize_ws(text)) if s.strip()]
    seen = set()
    out = []
    for s in sents:
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(s)
    return " ".join(out)


@lru_cache(maxsize=4)
def _load(model_dir: str, device: str):
    tokenizer = AutoTokenizer.from_pretrained(model_dir, use_fast=True)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_dir)
    model.eval()
    model.to(device)

    # Prevent warning like: "generation flags not valid: ['early_stopping']"
    if hasattr(model, "generation_config") and hasattr(model.generation_config, "early_stopping"):
        try:
            model.generation_config.early_stopping = False
        except Exception:
            pass


    return tokenizer, model


def summarize_digest(
    digest_text: str,
    *,
    model_dir: str,
    max_tokens: int = 220,
    device: Optional[str] = None,
) -> str:
    """
    Returns a single paragraph summary string.

    max_tokens should map from API's options.maxTokens. The API contract allows 32..2048.
    """
    digest_text = _normalize_ws(digest_text)
    if not digest_text:
        return ""

    digest_text = _dedupe_sentences(digest_text)

    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    tokenizer, model = _load(model_dir, device)

    prompt = "summarize:\n\n" + digest_text


    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512).to(device)

    with torch.inference_mode():
        out = model.generate(
        **inputs,
        max_new_tokens=int(min(max_tokens, 90)),
        num_beams=4,
        do_sample=False,
        no_repeat_ngram_size=4,
        repetition_penalty=1.25,
        encoder_no_repeat_ngram_size=4,
        length_penalty=0.9
    )



    text = tokenizer.decode(out[0], skip_special_tokens=True)
    return _normalize_ws(text)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model_dir", required=True)
    ap.add_argument("--max_tokens", type=int, default=220)
    ap.add_argument("--digest", type=str, default="", help="Digest text. If empty, read from stdin.")
    args = ap.parse_args()

    if args.digest.strip():
        digest = args.digest.strip()
    else:
        print("Paste digest text. Press Ctrl+D when done (Ctrl+Z then Enter on Windows).")
        digest = sys.stdin.read().strip()
    summary = summarize_digest(digest, model_dir=args.model_dir, max_tokens=args.max_tokens)
    print("\n--- SUMMARY ---\n")
    print(summary)


if __name__ == "__main__":
    main()
