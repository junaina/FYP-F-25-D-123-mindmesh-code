from typing import List, Optional
import os

import torch
from transformers import T5ForConditionalGeneration, T5TokenizerFast

# path to the fine-tuned modeldir
_DEFAULT_MODEL_DIR = os.path.join("models", "t5-ami-small")


_model: Optional[T5ForConditionalGeneration] = None
_tokenizer: Optional[T5TokenizerFast] = None


def load_t5_model(model_dir: Optional[str] = None):
    #lazy loading of the t5 model
    global _model, _tokenizer

    if model_dir is None:
        model_dir = _DEFAULT_MODEL_DIR

    if _model is None or _tokenizer is None:
        print(f"[t5_summarizer] Loading model from {model_dir}")
        _tokenizer = T5TokenizerFast.from_pretrained(model_dir)
        _model = T5ForConditionalGeneration.from_pretrained(model_dir)
        _model.eval()

    return _model, _tokenizer


def chunk_by_tokens(
    text: str,
    tokenizer: T5TokenizerFast,
    max_tokens: int = 512,
) -> List[str]:
    # chunk text into pieces each with <= max_tokens tokens, breaking at sentence boundaries.
    import re

    sentences = re.split(r"(?<=[.!?])\s+", text)
    sentences = [s.strip() for s in sentences if s.strip()]

    chunks: List[str] = []
    current: List[str] = []
    current_tokens = 0

    for s in sentences:
        token_ids = tokenizer.encode(s, add_special_tokens=False)
        s_len = len(token_ids)

        if current and current_tokens + s_len > max_tokens:
            chunks.append(" ".join(current))
            current = [s]
            current_tokens = s_len
        else:
            current.append(s)
            current_tokens += s_len

    if current:
        chunks.append(" ".join(current))

    return chunks


def summarize_chunk(
    text: str,
    model_dir: Optional[str] = None,
    max_input_tokens: int = 512,
    max_output_tokens: int = 128,
    num_beams: int = 4,
) -> str:
   #single chunk summarization with t5
    model, tokenizer = load_t5_model(model_dir)

    prefix = "summarize: "
    inputs = tokenizer(
        prefix + text,
        return_tensors="pt",
        max_length=max_input_tokens,
        truncation=True,
    )

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=max_output_tokens,
            num_beams=num_beams,
            length_penalty=1.0,
            no_repeat_ngram_size=3,
        )
        
    summary = tokenizer.decode(
        output_ids[0],
        skip_special_tokens=True,
        clean_up_tokenization_spaces=True,
    )
    return summary
