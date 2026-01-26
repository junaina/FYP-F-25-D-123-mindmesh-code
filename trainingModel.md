
# Abstractive Summarization — Decisions Log (README)

This document captures the decisions we’ve made (in this chat) for implementing the **abstractive summarization step** in the meeting summarization pipeline.

---

## Goal

Replace the current stubbed **abstractive** step in the Python summarizer with a real fine-tuned model, while keeping everything **testable in small steps** and keeping the existing API contract stable.

---

## High-Level Pipeline Decision

### Input to the abstractive model

✅ **We will feed ONLY the extractive “digest sentences”** (not the full transcript) into the abstractive model.

Reason:

* Keeps input short and consistent
* Makes fine-tuning easier
* Improves CPU inference feasibility later

---

## Dataset Decision

✅ We will **stick with** the Hugging Face dataset:

* **`knkarthick/AMI`**

We are **not** switching to official AMI NXT/XML annotations.

Reason:

* Simpler loading/training loop
* Avoids annotation conversion complexity

---

## Model Choice Decision

✅ Primary model family: **FLAN-T5** (seq2seq encoder–decoder)

Training plan:

1. **Fine-tune `flan-t5-small` first** as a fast baseline (validate pipeline end-to-end)
2. Then upgrade to **`flan-t5-base`** for better quality once everything is stable

Reason:

* Small gives fast iteration and confidence
* Base improves output quality after the system is proven

---

## Output Format Decision

✅ Model target output will be a **single concise paragraph summary**.

Frontend handling:

* FE can display as-is or split into bullets later if desired.

Reason:

* Simplest + most robust formatting (less “template brittleness”)
* AMI summaries in HF dataset may not be consistently bullet-structured

---

## Action Items Decision

✅ We will **NOT** train the model to output action items as a separate labelled field.

Instead:

* Use a **heuristics-based action item extractor** (rule-based) alongside the summary.

Reason:

* Avoids the “structured annotation” hassle
* Keeps ML step focused on summarization quality
* You’re okay rendering/structuring in FE later

---

## Digest Length Control Decision (Critical for training + CPU inference)

✅ Digest construction rule:

* Use **top-K sentences** from the extractive scorer

  * **K = 10 sentences**
* Plus a **hard cap** on final digest size:

  * **~1,200 to 1,500 characters**
  * If the joined digest exceeds this, truncate

Reason:

* Stabilises training (consistent input lengths)
* Prevents outliers from causing token blowups
* Directly improves CPU inference time later

---

## CPU Inference Speed Expectations & Optimisation Decisions

### What fine-tuning changes (and does NOT change)

* Fine-tuning **does not change** model architecture size → `flan-t5-base` stays the same compute class.
* CPU speed is mainly affected by:

  * input length (digest size)
  * output length (summary tokens)
  * decoding strategy (beams vs greedy)

### Optimisation decisions we’ll use

✅ At inference time, prefer:

* **short outputs** (cap max tokens / max_new_tokens)
* **fast decoding** (greedy / low-beam)

✅ At training/design time, we already optimised CPU inference by:

* using **digest-only inputs**
* enforcing **digest caps**
* choosing **paragraph output** (usually shorter than structured multi-section output)

---

## Implementation Guardrails

✅ Keep the current API contract stable:

* Python FastAPI endpoint and response shape should remain unchanged.
* Only swap the internal logic of the abstractive function (stub → real model inference).

✅ Development approach:

* “Testable baby steps”:

  1. Train + save model
  2. Smoke-test inference locally (no API)
  3. Wire inference into API
  4. End-to-end tests (Postman → Next API → UI)

---

## Current Status

* Extractive step is working and produces digest sentences.
* Abstractive step is currently stubbed and returns fallback output.
* The chosen direction is to replace the abstractive stub with a fine-tuned FLAN-T5 model.

---
