import { ThreadRepo } from "../repo/thread.repo";
import { DiscussionService } from "./discussion.service";
import { CreateThreadDto } from "../dto/create-thread.dto";

class ThreadServiceClass {
  private threadRepo = new ThreadRepo();
  private discussionService = new DiscussionService();

  async createThread(dto: CreateThreadDto) {
    const discussion = await this.discussionService.getOrCreateDiscussion(dto.projectId);

    return this.threadRepo.create(
      discussion.id,
      dto.topic,
      dto.description,
      dto.userId
    );
  }

  async listThreads(projectId: string) {
  const discussion = await this.discussionService.getOrCreateDiscussion(projectId);
  return this.threadRepo.listByDiscussion(discussion.id);
}
}


export const ThreadService = new ThreadServiceClass();
