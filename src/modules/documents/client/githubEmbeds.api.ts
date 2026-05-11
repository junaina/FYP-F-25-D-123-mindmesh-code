// src/modules/documents/client/githubEmbeds.api.ts
import type {
  EmbedRow,
  GitHubIssueMeta,
  GitHubPRMeta,
} from "@/modules/documents/domain/embed.types";

export type GitHubStatus =
  | { connected: false }
  | { connected: true; providerUserId: string; scope?: string };

export async function getGitHubStatus(): Promise<GitHubStatus> {
  const res = await fetch("/api/integrations/github/status", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    // treat any failure as "not connected" for UI gating
    return { connected: false };
  }

  return (await res.json()) as GitHubStatus;
}

export async function createGitHubEmbed(args: {
  projectId: string;
  docId: string;
  url: string;
}): Promise<EmbedRow<GitHubIssueMeta | GitHubPRMeta>> {
  const res = await fetch(
    `/api/projects/${args.projectId}/docs/${args.docId}/embeds/github`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url: args.url }),
    },
  );

  if (res.status === 409) {
    // your backend returns {code:"GITHUB_NOT_CONNECTED"} in this case
    const j = await res.json().catch(() => null);
    const err: any = new Error("GITHUB_NOT_CONNECTED");
    err.code = j?.code ?? "GITHUB_NOT_CONNECTED";
    err.status = 409;
    throw err;
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err: any = new Error("CREATE_GITHUB_EMBED_FAILED");
    err.status = res.status;
    err.details = txt;
    throw err;
  }

  return (await res.json()) as EmbedRow<GitHubIssueMeta | GitHubPRMeta>;
}

export async function refreshGitHubEmbed(args: {
  projectId: string;
  docId: string;
  embedId: string;
}): Promise<GitHubIssueMeta | GitHubPRMeta> {
  const res = await fetch(
    `/api/projects/${args.projectId}/docs/${args.docId}/embeds/github/${args.embedId}/refresh`,
    { method: "POST", credentials: "include" },
  );

  if (res.status === 409) {
    const j = await res.json().catch(() => null);
    const err: any = new Error("GITHUB_NOT_CONNECTED");
    err.code = j?.code ?? "GITHUB_NOT_CONNECTED";
    err.status = 409;
    throw err;
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err: any = new Error("REFRESH_GITHUB_EMBED_FAILED");
    err.status = res.status;
    err.details = txt;
    throw err;
  }

  return (await res.json()) as GitHubIssueMeta | GitHubPRMeta;
}
