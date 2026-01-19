import { NextResponse, NextRequest } from "next/server";
import { MessageService } from "@/modules/discussions/service/message.service";
import { getSessionUser } from "@/lib/auth/getSessionUser";

interface RouteParams {
  params: {
    projectId: string;
    threadId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { threadId } = params;

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const messages = await MessageService.listMessages(threadId, user.id);
    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, threadId } = params;

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const msg = await MessageService.createMessage(
      projectId,
      threadId,
      user.id,
      data.body ?? "",
      data.bodyJson ?? null,
      data.attachmentIds ?? [],
    );

    return NextResponse.json(msg, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
