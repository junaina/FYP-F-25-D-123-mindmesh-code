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

  // 2) call FastAPI
  const body = await req.json().catch(() => ({}));
  const chunkSize = body.chunkSize ?? 1000;
  const overlap = body.overlap ?? 150;

  const fastApiUrl = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000";

  const res = await fetch(`${fastApiUrl}/rag/index_project`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId, chunkSize, overlap }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
