import { homeRepo } from "../repo/home.repo";

export const homeService = {
  async getHome(userId: string) {
    const [projects, recentDocs] = await Promise.all([
      homeRepo.getProjectsForUser(userId),
      homeRepo.getRecentDocsForUser(userId),
    ]);
    return { projects, recentDocs };
  },
};
