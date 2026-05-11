import { NextResponse } from "next/server";
// import { getSessionUser } from "@/lib/auth/session";
// import { accessRepo } from "@/modules/documents/repo/access.repo";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } },
) {
  const projectId = params.projectId;

  // 1) membership check (keep it here)
  // const user = await getSessionUser();
  // if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  // const allowed = await accessRepo.isProjectMember(projectId, user.id);
  // if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 2) read request body
  const body = await req.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim() : "";
  const topK =
    typeof body.topK === "number" && Number.isFinite(body.topK) ? body.topK : 6;

  const sourceType =
    typeof body.sourceType === "string" && body.sourceType.trim()
      ? body.sourceType.trim()
      : undefined;

  const sourceId =
    typeof body.sourceId === "string" && body.sourceId.trim()
      ? body.sourceId.trim()
      : undefined;

  if (!query) {
    return NextResponse.json(
      { error: "Missing required field: query" },
      { status: 400 },
    );
  }

  const fastApiUrl = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000";

  // 3) call FastAPI
  let res: Response;
  try {
    res = await fetch(`${fastApiUrl}/rag/query_project`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId, query, topK, sourceType, sourceId }),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to reach Python service", detail: String(e) },
      { status: 502 },
    );
  }

  // 4) forward response
  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: res.status });
  } catch {
    // If FastAPI returned non-JSON (traceback, HTML, etc.)
    return NextResponse.json(
      { error: "Python service returned non-JSON", raw: text },
      { status: res.status || 500 },
    );
  }
}
