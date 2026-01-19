import { MessageRepo } from "../repo/message.repo";
import { prisma } from "@/lib/prisma";
const MENTION_RE = /@\[[^\]]+\]\(([0-9a-fA-F-]{36})\)/g;

function extractMentionUserIds(body: string): string[] {
  const ids = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = MENTION_RE.exec(body))) ids.add(m[1]);
  return [...ids];
}

class MessageServiceClass {
  private messageRepo = new MessageRepo();

  async createMessage(
    projectId: string,
    threadId: string,
    userId: string,
    body: string,
    bodyJson: any,
  ) {
    // 1. Ensure project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new Error("Project not found");

    // 2. Ensure thread belongs to this project
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { discussion: true },
    });

    if (!thread) throw new Error("Thread not found");
    if (thread.discussion.projectId !== projectId)
      throw new Error("Thread does not belong to this project");

    // 3. Auto-add user to project (temporary logic)
    await this.messageRepo.ensureProjectMember(projectId, userId);

    // 4. Auto-add user to thread
    await this.messageRepo.ensureThreadMember(threadId, userId);

    // 5. Create message
    const mentionUserIds = extractMentionUserIds(body);

    const msg = await this.messageRepo.createMessage(
      threadId,
      userId,
      body,
      bodyJson,
      mentionUserIds,
    );

    return msg;
  }

  async listMessages(threadId: string, viewerId: string) {
    const rows = await this.messageRepo.listMessages(threadId);

    return rows.map((m: any) => {
      const map = new Map<
        string,
        { emoji: string; count: number; reactedByMe: boolean }
      >();
      for (const r of m.reactions ?? []) {
        const cur = map.get(r.emoji) ?? {
          emoji: r.emoji,
          count: 0,
          reactedByMe: false,
        };
        cur.count += 1;
        if (r.userId === viewerId) cur.reactedByMe = true;
        map.set(r.emoji, cur);
      }
      return { ...m, reactions: Array.from(map.values()) };
    });
  }
}

export const MessageService = new MessageServiceClass();
