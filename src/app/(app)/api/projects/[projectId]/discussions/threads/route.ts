import { NextResponse } from "next/server";
import { ThreadService } from "@/modules/discussions/service/thread.service";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    // Ensure user is logged in
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch threads for project
    const threads = await ThreadService.listThreads(projectId);
    console.log("Threads fetched:", threads);
    return NextResponse.json({ threads });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    // REAL AUTH — using session user
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Create thread with real userId
    const thread = await ThreadService.createThread({
      topic: data.topic,
      description: data.description ?? null,
      projectId,
      userId: user.id,
    });

    return NextResponse.json(thread, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
