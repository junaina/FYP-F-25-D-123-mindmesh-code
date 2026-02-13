// src/app/(app)/api/projects/[projectId]/members/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { ProjectMemberService } from "@/modules/projects/service/projectMember.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const query =
    url.searchParams.get("query") ?? url.searchParams.get("q") ?? "";

  const members = await ProjectMemberService.searchMembers(projectId, query);
  return NextResponse.json({ members });
}
