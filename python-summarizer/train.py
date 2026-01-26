"""
train.py — fine-tune FLAN-T5 on AMI (digest -> summary)

Design goals:
- Training inputs match runtime plan: we feed extractive digest sentences (not full transcripts).
- Output is a single concise paragraph summary (simple + robust).
- Save model/tokenizer in output_dir for infer.py to load later.
"""

import argparse
import os
import re
from dataclasses import dataclass
from typing import Dict, List, Tuple
import numpy as np

import evaluate
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    DataCollatorForSeq2Seq,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
)


# ----------------------------
# Digest builder (match runtime)
# ----------------------------

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")
_TS_SPK_RE = re.compile(r"^\s*\[\d{2}:\d{2}\]\s*[^:]{1,40}:\s*", re.IGNORECASE)

def _normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

def _clean_transcript(text: str) -> str:
    # Similar to api.py Stage A cleaning: strip timestamp/speaker prefix per line and normalize.
    out_lines = []
    for line in text.splitlines():
        s = line.strip()
        if not s:
            continue
        s = _TS_SPK_RE.sub("", s).strip()
        out_lines.append(s)
    return _normalize_ws(" ".join(out_lines))

def _split_sentences(text: str) -> List[str]:
    t = _normalize_ws(text)
    if not t:
        return []
    sents = _SENTENCE_SPLIT_RE.split(t)
    # Drop ultra-short fragments
    return [s.strip() for s in sents if len(s.strip()) >= 25]

def _score_sentence(s: str) -> float:
    lower = s.lower()
    score = 0.0

    # Prefer medium-length sentences
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
        "need to","we should","let's","assign","responsible",
    )
    for k in keywords:
        if k in lower:
            score += 0.7

    # De-prioritize mic-check/counting
    if re.search(r"\bone,\s*two,\s*three\b", lower) or re.search(r"\b1,\s*2,\s*3\b", lower):
        score -= 1.5

    return score

def build_digest(dialogue: str, *, keep_sentences: int, hard_cap_chars: int) -> str:
    """
    Returns a digest string built from top-K scored sentences,
    preserving original order, and then hard-capped by chars.
    """
    cleaned = _clean_transcript(dialogue)
    sents = _split_sentences(cleaned)
    if not sents:
        return ""

    scored: List[Tuple[int, float]] = [(i, _score_sentence(sents[i])) for i in range(len(sents))]
    top = sorted(scored, key=lambda x: x[1], reverse=True)[: max(1, keep_sentences)]
    idxs = sorted(i for i, _ in top)
    digest_sents = [sents[i] for i in idxs]

    digest = "\n".join(digest_sents).strip()
    if len(digest) > hard_cap_chars:
        digest = digest[:hard_cap_chars].rsplit(" ", 1)[0].strip()  # avoid cutting last word mid-way
    return digest


# ----------------------------
# Preprocess + metrics
# ----------------------------

@dataclass
class PreprocessConfig:
    instruction: str
    keep_sentences: int
    hard_cap_chars: int
    max_source_length: int
    max_target_length: int


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model_name", default="google/flan-t5-small")
    ap.add_argument("--output_dir", default="models/flan-ami-small")
    ap.add_argument("--num_train_epochs", type=int, default=3)
    ap.add_argument("--learning_rate", type=float, default=5e-5)
    ap.add_argument("--per_device_train_batch_size", type=int, default=4)
    ap.add_argument("--per_device_eval_batch_size", type=int, default=4)
    ap.add_argument("--gradient_accumulation_steps", type=int, default=4)
    ap.add_argument("--max_train_samples", type=int, default=0, help="0 = use full train split")
    ap.add_argument("--max_eval_samples", type=int, default=0, help="0 = use full validation split")
    ap.add_argument("--seed", type=int, default=42)

    # Digest + token limits (matches our chat decisions)
    ap.add_argument("--keep_sentences", type=int, default=10)
    ap.add_argument("--hard_cap_chars", type=int, default=1500)
    ap.add_argument("--max_source_length", type=int, default=512)
    ap.add_argument("--max_target_length", type=int, default=220)

    args = ap.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    cfg = PreprocessConfig(
        instruction="summarize:",
        keep_sentences=args.keep_sentences,
        hard_cap_chars=args.hard_cap_chars,
        max_source_length=args.max_source_length,
        max_target_length=args.max_target_length,
    )

    print(f"[train] loading dataset: knkarthick/AMI")
    ds = load_dataset("knkarthick/AMI")

    train_ds = ds["train"]
    eval_ds = ds["validation"] if "validation" in ds else ds.get("val", None)
    if eval_ds is None:
        raise RuntimeError("Dataset has no validation split found (expected 'validation' or 'val').")

    if args.max_train_samples and args.max_train_samples > 0:
        train_ds = train_ds.select(range(min(args.max_train_samples, len(train_ds))))
    if args.max_eval_samples and args.max_eval_samples > 0:
        eval_ds = eval_ds.select(range(min(args.max_eval_samples, len(eval_ds))))

    print(f"[train] train size = {len(train_ds)}, eval size = {len(eval_ds)}")

    tokenizer = AutoTokenizer.from_pretrained(args.model_name, use_fast=True)
    model = AutoModelForSeq2SeqLM.from_pretrained(args.model_name)

    def preprocess(batch: Dict[str, List[str]]) -> Dict[str, List[List[int]]]:
        dialogues = batch["dialogue"]
        summaries = batch["summary"]

        inputs: List[str] = []
        targets: List[str] = []

        for d, s in zip(dialogues, summaries):
            digest = build_digest(d, keep_sentences=cfg.keep_sentences, hard_cap_chars=cfg.hard_cap_chars)
            # Always feed digest (even if short) to keep training/inference consistent.
            src = f"{cfg.instruction}\n\n{digest}"
            inputs.append(src)
            targets.append(_normalize_ws(s))

        model_inputs = tokenizer(
            inputs,
            max_length=cfg.max_source_length,
            truncation=True,
            padding=False,
        )

        with tokenizer.as_target_tokenizer():
            labels = tokenizer(
                targets,
                max_length=cfg.max_target_length,
                truncation=True,
                padding=False,
            )

        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    train_tok = train_ds.map(preprocess, batched=True, remove_columns=train_ds.column_names)
    eval_tok = eval_ds.map(preprocess, batched=True, remove_columns=eval_ds.column_names)

    data_collator = DataCollatorForSeq2Seq(tokenizer=tokenizer, model=model)

    rouge = evaluate.load("rouge")

    def compute_metrics(eval_pred):
        preds, labels = eval_pred

        # In newer Transformers, preds may be a tuple (sequences, ...)
        if isinstance(preds, tuple):
            preds = preds[0]

        preds = np.array(preds)
        labels = np.array(labels)

        # If preds are logits (batch, seq, vocab), convert to token ids
        if preds.ndim == 3:
            preds = preds.argmax(axis=-1)

                # Ensure integer dtype for tokenizer decode
        preds = preds.astype(np.int64)

        # ---- NEW: sanitize token ids so tokenizer never sees negatives / out-of-vocab ----
        vocab_size = getattr(tokenizer, "vocab_size", None) or len(tokenizer)
        pad_id = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else 0
        unk_id = tokenizer.unk_token_id if tokenizer.unk_token_id is not None else 0

        # Replace negative ids (common from padding/sentinels) with pad_id
        preds = np.where(preds < 0, pad_id, preds)
        # Replace out-of-range ids with unk_id
        preds = np.where(preds >= vocab_size, unk_id, preds)
        # -------------------------------------------------------------------------------

        # Replace -100 with pad_token_id so we can decode labels
        labels = labels.astype(np.int64)
        labels = np.where(labels == -100, pad_id, labels)

        decoded_preds = tokenizer.batch_decode(preds, skip_special_tokens=True)
        decoded_labels = tokenizer.batch_decode(labels, skip_special_tokens=True)


        # Replace -100 with pad_token_id so we can decode labels
        labels = labels.astype(np.int64)
        labels = np.where(labels == -100, tokenizer.pad_token_id, labels)

        decoded_preds = tokenizer.batch_decode(preds, skip_special_tokens=True)
        decoded_labels = tokenizer.batch_decode(labels, skip_special_tokens=True)

        decoded_preds = [_normalize_ws(p) for p in decoded_preds]
        decoded_labels = [_normalize_ws(l) for l in decoded_labels]

        scores = rouge.compute(predictions=decoded_preds, references=decoded_labels, use_stemmer=True)
        return {k: round(v * 100, 2) for k, v in scores.items()}

    training_args = Seq2SeqTrainingArguments(
        output_dir=args.output_dir,
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=args.learning_rate,
        per_device_train_batch_size=args.per_device_train_batch_size,
        per_device_eval_batch_size=args.per_device_eval_batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        num_train_epochs=args.num_train_epochs,
        predict_with_generate=True,
        generation_max_length=cfg.max_target_length,
        logging_steps=50,
        seed=args.seed,
        fp16=False,  # assumes CUDA; if bf16 available you can switch to bf16=True
        report_to="none",
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=train_tok,
        eval_dataset=eval_tok,
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )

    print("[train] starting training…")
    trainer.train()

    print("[train] saving final model + tokenizer…")
    trainer.save_model(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    print(f"[train] done. saved to: {args.output_dir}")


if __name__ == "__main__":
    main()
