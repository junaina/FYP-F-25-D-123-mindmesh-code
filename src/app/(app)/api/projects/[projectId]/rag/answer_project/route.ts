import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const body = await req.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json(
      { error: "Missing required field: query" },
      { status: 400 },
    );
  }

  const topK =
    typeof body.topK === "number" && Number.isFinite(body.topK) ? body.topK : 6;

  const minChars =
    typeof body.minChars === "number" && Number.isFinite(body.minChars)
      ? body.minChars
      : 80;

  const sourceType =
    typeof body.sourceType === "string" && body.sourceType.trim()
      ? body.sourceType.trim()
      : undefined;

  const sourceId =
    typeof body.sourceId === "string" && body.sourceId.trim()
      ? body.sourceId.trim()
      : undefined;

  const fastApiUrl = process.env.PYTHON_SERVICE_URL ?? "http://127.0.0.1:8000";

  let res: Response;
  try {
    res = await fetch(`${fastApiUrl}/rag/answer_project`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId,
        query,
        topK,
        minChars,
        sourceType,
        sourceId,
      }),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to reach Python service", detail: String(e) },
      { status: 502 },
    );
  }

  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Python service returned non-JSON", raw: text },
      { status: res.status || 500 },
    );
  }
}
