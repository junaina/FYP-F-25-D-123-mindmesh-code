import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { ReactionService } from "@/modules/discussions/service/reaction.service";

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: { projectId: string; threadId: string; messageId: string } },
) {
  try {
    const user = await getSessionUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { emoji } = await req.json();

    const result = await ReactionService.toggleReaction({
      projectId: params.projectId,
      threadId: params.threadId,
      messageId: params.messageId,
      userId: user.id,
      emoji,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 400 },
    );
  }
}
