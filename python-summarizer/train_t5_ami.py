import argparse
import os
from datasets import load_dataset
from transformers import (
    T5ForConditionalGeneration,
    T5TokenizerFast,
    DataCollatorForSeq2Seq,
    Seq2SeqTrainingArguments,
    Seq2SeqTrainer,
)


# command line args
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--model_name",
        type=str,
        default="t5-small",
        help="Base model name, where we'll fine-tune from",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="models/t5-ami-small",
        help="Where to save the fine-tuned model",
    )
    parser.add_argument(
        "--max_train_samples",
        type=int,
        default=2000,
        help="Limit number of training examples if your PC is bad (mine is too).",
    )
    parser.add_argument(
        "--max_eval_samples",
        type=int,
        default=500,
        help="Limit number of eval examples",
    )
    parser.add_argument(
        "--num_train_epochs",
        type=float,
        default=2.0,
        help="Number of epochs",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    print("Loading AMI dataset knkarthick/AMI...")
    dataset = load_dataset("knkarthick/AMI")

    # Many HF dialogue-summary datasets use 'dialogue' + 'summary'.
    # If this crashes, print(dataset['train'].column_names) and adjust.
    text_column = "dialogue"
    summary_column = "summary"

    tokenizer = T5TokenizerFast.from_pretrained(args.model_name)
    model = T5ForConditionalGeneration.from_pretrained(args.model_name)

    max_source_length = 512
    max_target_length = 128

    # because T5 is trained with task prefixes, we add one too
    prefix = "summarize: "

    # preprocessing
    def preprocess(batch):
        inputs = [prefix + x for x in batch[text_column]]
        model_inputs = tokenizer(
            inputs,
            max_length=max_source_length,
            truncation=True,
        )
        with tokenizer.as_target_tokenizer():
            labels = tokenizer(
                batch[summary_column],
                max_length=max_target_length,
                truncation=True,
            )
        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    train_ds = dataset["train"]
    eval_split_name = "validation" if "validation" in dataset else "test"
    eval_ds = dataset[eval_split_name]

    if args.max_train_samples and args.max_train_samples < len(train_ds):
        train_ds = train_ds.shuffle(seed=42).select(range(args.max_train_samples))
    if args.max_eval_samples and args.max_eval_samples < len(eval_ds):
        eval_ds = eval_ds.shuffle(seed=42).select(range(args.max_eval_samples))

    train_ds = train_ds.map(
        preprocess,
        batched=True,
        remove_columns=train_ds.column_names,
    )
    eval_ds = eval_ds.map(
        preprocess,
        batched=True,
        remove_columns=eval_ds.column_names,
    )

    data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)

    training_args = Seq2SeqTrainingArguments(
        output_dir=os.path.join(args.output_dir, "checkpoints"),
        evaluation_strategy="epoch",
        save_strategy="epoch",
        learning_rate=3e-4,
        per_device_train_batch_size=1,  # CPU-friendly
        per_device_eval_batch_size=1,
        gradient_accumulation_steps=8,  # effective batch size 8
        weight_decay=0.01,
        save_total_limit=2,
        num_train_epochs=args.num_train_epochs,
        predict_with_generate=True,
        logging_steps=50,
        fp16=False,
        bf16=False,
        report_to=[],
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        use_cpu=True,  # force CPU
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=eval_ds,
        tokenizer=tokenizer,
        data_collator=data_collator,
    )

    print("Starting training on CPU (this will be slow)...")
    trainer.train()

    print(f"Saving final model to {args.output_dir}")
    trainer.save_model(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    print("Done.")


if __name__ == "__main__":
    main()
