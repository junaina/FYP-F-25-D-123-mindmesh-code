import { ProjectMemberRepo } from "../repo/projectMember.repo";

class ProjectMemberServiceClass {
  private repo = new ProjectMemberRepo();

  async searchMembers(projectId: string, query: string) {
    const rows = await this.repo.searchMembers(projectId, query);
    return rows.map((r) => r.user);
  }
}

export const ProjectMemberService = new ProjectMemberServiceClass();
