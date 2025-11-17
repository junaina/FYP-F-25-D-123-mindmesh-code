import { DiscussionRepo } from "../repo/discussion.repo";

export class DiscussionService {
  private discussionRepo = new DiscussionRepo();

  async getOrCreateDiscussion(projectId: string) {
    let discussion = await this.discussionRepo.findByProjectId(projectId);

    if (!discussion) {
      discussion = await this.discussionRepo.createForProject(projectId);
    }

    return discussion;
  }
}
