import { ReactionRepo } from "../repo/reaction.repo";

class ReactionServiceClass {
  private repo = new ReactionRepo();

  async toggleReaction(input: {
    projectId: string;
    threadId: string;
    messageId: string;
    userId: string;
    emoji: string;
  }) {
    if (!input.emoji || typeof input.emoji !== "string") {
      const e: any = new Error("Invalid emoji");
      e.status = 400;
      throw e;
    }

    await this.repo.assertMessageScope({
      projectId: input.projectId,
      threadId: input.threadId,
      messageId: input.messageId,
    });

    return this.repo.toggleReaction({
      messageId: input.messageId,
      userId: input.userId,
      emoji: input.emoji,
    });
  }
}

export const ReactionService = new ReactionServiceClass();
