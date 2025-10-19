import { RenameProjectInput } from "../dto/project.dto";
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
  renameForUser: async (
    userId: string,
    projectId: string,
    input: RenameProjectInput
  ): Promise<ProjectLite> => {
    const name = input.name.trim();
    if (!name) throw new Error("Project name is required");

    //authorization and rbac
    const role = await projectRepo.getMemberRole(projectId, userId);
    if (!role || (role !== "OWNER" && role !== "ADMIN")) {
      const err = new Error(
        "You do not have permission to rename this project"
      );
      (err as any).status = 403;
      throw err;
    }
    return projectRepo.rename({ projectId, name });
  },
  deleteForUser: async (
    userId: string,
    projectId: string
  ): Promise<{ id: string }> => {
    // RBAC: OWNER or ADMIN can delete
    const role = await projectRepo.getMemberRole(projectId, userId);
    if (!role || (role !== "OWNER" && role !== "ADMIN")) {
      const err: any = new Error(
        "You do not have permission to delete this project"
      );
      err.status = 403;
      throw err;
    }
    // Hard delete; schema uses onDelete: Cascade for relations
    return projectRepo.deleteById(projectId);
  },
};
