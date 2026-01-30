import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } },
) {
  const { projectId } = params;

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

  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { error: "Python service returned non-JSON", raw: text },
      { status: res.status || 500 },
    );
  }

  // ---- Enrich citations: only DOCUMENT sources, attach title + href ----
  const rawCitations = Array.isArray(data?.citations) ? data.citations : [];

  // Skip meetings entirely for now
  const docCitations = rawCitations.filter((c: any) => c?.sourceType === "DOCUMENT");

  const docIds = Array.from(new Set(docCitations.map((c: any) => c.sourceId)));

  const docs = docIds.length
    ? await prisma.document.findMany({
        where: { id: { in: docIds }, projectId },
        select: { id: true, title: true },
      })
    : [];

  const titleById = new Map(docs.map((d) => [d.id, d.title]));

  const enriched = docCitations.map((c: any) => {
    const title = titleById.get(c.sourceId) ?? "Document";
    return {
      ...c,
      sourceTitle: title,
      href: `/projects/${projectId}/docs/${c.sourceId}`,
    };
  });

  return NextResponse.json(
    {
      ...data,
      citations: enriched,
    },
    { status: res.status },
  );
}
