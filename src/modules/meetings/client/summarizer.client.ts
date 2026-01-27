// the bridge that calls the python service

export type SummarizerFormat = "bullets" | "paragraph";

export type SummarizeResponse = {
  summary: string;
  model: { name: string; version: string };
  meta: { latencyMs: number; charsIn: number };
};

export class SummarizerUnavailableError extends Error {
  override name = "SummarizerUnavailableError";
}

function baseUrl() {
  const url = process.env.SUMMARIZER_API_BASE_URL;
  if (!url)
    throw new SummarizerUnavailableError("Missing SUMMARIZER_API_BASE_URL");
  return url.replace(/\/+$/, "");
}

export async function summarizeViaPythonSummarizer(args: {
  meetingId?: string;
  transcript: string;
  options?: { format?: SummarizerFormat; maxTokens?: number };
}): Promise<SummarizeResponse> {
  //forwards request to python's fast api summarizer that infers using the trained model
  const res = await fetch(`${baseUrl()}/summarize`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      meetingId: args.meetingId,
      transcript: args.transcript,
      options: {
        format: args.options?.format ?? "bullets",
        maxTokens: args.options?.maxTokens ?? 220,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new SummarizerUnavailableError(
      `python-summarizer failed (${res.status}): ${text || res.statusText}`,
    );
  }

  return (await res.json()) as SummarizeResponse;
}
