import { MessageRepo } from "../repo/message.repo";
import { prisma } from "@/lib/prisma";

class MessageServiceClass {
  private messageRepo = new MessageRepo();

  async createMessage(projectId: string, threadId: string, userId: string, body: string, bodyJson: any) {
    
    // 1. Ensure project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error("Project not found");

    // 2. Ensure thread belongs to this project
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { discussion: true }
    });

    if (!thread) throw new Error("Thread not found");
    if (thread.discussion.projectId !== projectId)
      throw new Error("Thread does not belong to this project");

    // 3. Auto-add user to project (temporary logic)
    await this.messageRepo.ensureProjectMember(projectId, userId);

    // 4. Auto-add user to thread
    await this.messageRepo.ensureThreadMember(threadId, userId);

    // 5. Create message
    return this.messageRepo.createMessage(threadId, userId, body, bodyJson);
  }

  async listMessages(threadId: string) {
    return this.messageRepo.listMessages(threadId);
  }
}

export const MessageService = new MessageServiceClass();
