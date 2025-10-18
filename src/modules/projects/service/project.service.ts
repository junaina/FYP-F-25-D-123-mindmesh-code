import { projectRepo, type ProjectLite } from "../repo/project.repo";

export type CreateProjectInput = {
  name: string;
  visibility?: "PRIVATE" | "LINK" | "ORG";
};

export const projectService = {
  listForSidebar: (userId: string): Promise<ProjectLite[]> => {
    return projectRepo.listForUser(userId);
  },

  createForUser: async (
    userId: string,
    data: CreateProjectInput
  ): Promise<ProjectLite> => {
    const name = data.name?.trim();
    if (!name) throw new Error("Project name is required");

    const visibility = data.visibility ?? "PRIVATE";

    return projectRepo.createProjectWithOwner({
      name,
      visibility,
      createdById: userId,
    });
  },
};
