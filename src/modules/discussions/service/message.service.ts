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
    // --- notifications (checkbox-worthy) ---
    const recipientIds = mentionUserIds.filter((id) => id !== userId); // don't notify yourself

    if (recipientIds.length) {
      // 1) Only notify real project members (avoids weird/stale ids)
      const members = await prisma.projectMember.findMany({
        where: { projectId, userId: { in: recipientIds } },
        select: { userId: true },
      });
      const memberSet = new Set(members.map((m) => m.userId));
      const candidates = recipientIds.filter((id) => memberSet.has(id));

      if (candidates.length) {
        // 2) Respect prefs (global + project + thread mute)
        const prefRows = await prisma.user.findMany({
          where: { id: { in: candidates } },
          select: {
            id: true,
            globalPrefs: { select: { notificationsEnabled: true } },
            projectSettings: {
              where: { projectId },
              select: { notificationsEnabled: true },
            },
            threadPrefs: {
              where: { threadId },
              select: { isMuted: true },
            },
          },
        });

        const enabledIds = prefRows
          .filter((u) => {
            const globalOk = u.globalPrefs?.notificationsEnabled ?? true;
            const projectOk =
              u.projectSettings[0]?.notificationsEnabled ?? true;
            const muted = u.threadPrefs[0]?.isMuted ?? false;
            return globalOk && projectOk && !muted;
          })
          .map((u) => u.id);

        if (enabledIds.length) {
          const senderName =
            `${msg.sender.firstName ?? ""} ${msg.sender.lastName ?? ""}`.trim() ||
            "Someone";

          // make preview human (strip ids)
          const preview = msg.body
            .replace(/@\[(.*?)\]\([^)]+\)/g, "@$1")
            .slice(0, 140);

          await prisma.notification.createMany({
            data: enabledIds.map((uid) => ({
              userId: uid,
              actorId: userId,
              type: "MENTION",
              projectId,
              threadId,
              messageId: msg.id,
              title: `${senderName} mentioned you`,
              bodyPreview: preview,
              url: `/projects/${projectId}/discussions/threads/${threadId}`,
            })),
            skipDuplicates: true, // backed by @@unique too
          });
        }
      }
    }

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
