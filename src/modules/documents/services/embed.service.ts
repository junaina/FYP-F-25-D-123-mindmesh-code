// src/modules/documents/services/embed.service.ts
import { isAuthDisabled } from "@/lib/auth";
import { accessRepo } from "@/modules/documents/repo/access.repo";
import { EmbedRepo } from "@/modules/documents/repo/embed.repo";
import type { GoogleDriveEmbedMeta } from "../domain/embed.types";
import type { GitHubIssueMeta, GitHubPRMeta } from "../domain/embed.types";
import { GitHubIdentityRepo } from "@/modules/integrations/github/repo/githubIdentity.repo";
import {
  parseGitHubUrl,
  fetchGitHubMeta,
} from "@/modules/integrations/github/services/githubApi.service";

// same logic pattern as in document.service.ts
async function canEdit(projectId: string, docId: string, userId: string) {
  if (isAuthDisabled()) return true;

  if (await accessRepo.isProjectMember(projectId, userId)) {
    return true;
  }

  const role = await accessRepo.getDocCollaboratorRole(docId, userId);
  return role === "COMMENTER" || role === "EDITOR";
}

export const EmbedService = {
  /**
   * Create a Google Drive PDF embed for a document.
   * Throws "Forbidden" if the user cannot edit the doc.
   */
  async addGoogleDrivePdf(args: {
    projectId: string;
    docId: string;
    userId: string;
    url: string;
    meta: GoogleDriveEmbedMeta;
  }) {
    const { projectId, docId, userId, url, meta } = args;

    const allowed = await canEdit(projectId, docId, userId);
    if (!allowed) {
      const err: any = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    return EmbedRepo.createGoogleDrivePdf({
      projectId,
      docId,
      url,
      meta,
    });
  },

  /**
   * List embeds for a document (handy for a sidebar later).
   */
  async listForDoc(args: { projectId: string; docId: string; userId: string }) {
    const { projectId, docId, userId } = args;

    const allowed = await canEdit(projectId, docId, userId);
    if (!allowed) {
      const err: any = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    return EmbedRepo.listForDocument({ projectId, docId });
  },
  async addGitHubFromUrl(args: {
    projectId: string;
    docId: string;
    userId: string;
    url: string;
  }) {
    const { projectId, docId, userId, url } = args;

    const allowed = await canEdit(projectId, docId, userId);
    if (!allowed) {
      const err: any = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    const token = await GitHubIdentityRepo.getAccessTokenForUser(userId);
    if (!token) {
      const err: any = new Error("GITHUB_NOT_CONNECTED");
      err.status = 409;
      throw err;
    }

    const parsed = parseGitHubUrl(url);
    const meta = await fetchGitHubMeta(token, parsed);

    if (meta.type === "issue") {
      return EmbedRepo.createGithubIssue({
        projectId,
        docId,
        url,
        meta: meta as GitHubIssueMeta,
      });
    }

    return EmbedRepo.createGithubPr({
      projectId,
      docId,
      url,
      meta: meta as GitHubPRMeta,
    });
  },

  async refreshGitHubEmbed(args: {
    projectId: string;
    docId: string;
    userId: string;
    embedId: string;
  }) {
    const { projectId, docId, userId, embedId } = args;

    const allowed = await canEdit(projectId, docId, userId);
    if (!allowed) {
      const err: any = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    const token = await GitHubIdentityRepo.getAccessTokenForUser(userId);
    if (!token) {
      const err: any = new Error("GITHUB_NOT_CONNECTED");
      err.status = 409;
      throw err;
    }

    const embed = await EmbedRepo.getGithubEmbedForDoc({
      embedId,
      projectId,
      docId,
    });

    const parsed = parseGitHubUrl(embed.url);
    const newMeta = await fetchGitHubMeta(token, parsed);

    await EmbedRepo.updateEmbedMeta({ embedId, meta: newMeta });
    return newMeta;
  },
};
