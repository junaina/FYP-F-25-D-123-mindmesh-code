from pipeline import summarize_transcript

FAKE_TRANSCRIPT = """
Alice: Hey everyone, thanks for joining. Today we need to finalise the launch plan
for the MindMesh meeting module.

Bob: I reviewed the latest designs. The end screen now shows transcript, speakers,
and diarized segments. We still need to hook up the summarization API.

Carol: I'll handle the frontend wiring. Once the FastAPI /summarize endpoint is ready,
I'll call it from our Next.js API route and store the result in Prisma.

Bob: For the model, we're fine-tuning T5-small on the AMI dataset. We'll run the pipeline
locally on a small server.

Alice: Great. Let's aim for a demo by Friday. Carol will own the UI, Bob the model,
and I'll handle infra and deployment.

Dave: One more thing, we should log how long summarization takes so we can optimize later.
"""


def main():
    print("Input transcript:")
    print(FAKE_TRANSCRIPT)
    print("-" * 80)

    summary = summarize_transcript(FAKE_TRANSCRIPT)
    print("Generated summary:")
    print(summary)


if __name__ == "__main__":
    main()
