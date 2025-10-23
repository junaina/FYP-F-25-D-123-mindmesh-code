import { projectRepo } from "../repo/project.repo";
import {
  listForProject,
  createInProject,
} from "@/modules/documents/repo/document.repo";

export const projectDashboardService = {
  async get(projectId: string, userId: string) {
    const project = await projectRepo.getByIdForUser(projectId, userId);
    if (!project) return null;

    const documents = await listForProject(projectId, userId);
    return { project, documents };
  },

  async createDocument(projectId: string, userId: string, title?: string) {
    const project = await projectRepo.getByIdForUser(projectId, userId);
    if (!project) return null;

    return createInProject(projectId, userId, title);
  },
};
