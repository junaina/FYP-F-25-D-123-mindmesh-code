// src/modules/integrations/github/services/githubApi.service.ts
import type {
  GitHubIssueMeta,
  GitHubPRMeta,
} from "@/modules/documents/domain/embed.types";

export type ParsedGitHubLink =
  | { type: "issue"; owner: string; repo: string; number: number }
  | { type: "pr"; owner: string; repo: string; number: number };

export function parseGitHubUrl(raw: string): ParsedGitHubLink {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    const err: any = new Error("invalid_url");
    err.status = 400;
    throw err;
  }

  const host = u.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    const err: any = new Error("not_github_url");
    err.status = 400;
    throw err;
  }

  const parts = u.pathname.split("/").filter(Boolean);
  // expected: /{owner}/{repo}/pull/{n} OR /{owner}/{repo}/issues/{n}
  if (parts.length < 4) {
    const err: any = new Error("unsupported_github_url");
    err.status = 400;
    throw err;
  }

  const [owner, repo, kind, numStr] = parts;
  const number = Number(numStr);

  if (!owner || !repo || !Number.isInteger(number) || number <= 0) {
    const err: any = new Error("unsupported_github_url");
    err.status = 400;
    throw err;
  }

  if (kind === "pull" || kind === "pulls") {
    return { type: "pr", owner, repo, number };
  }
  if (kind === "issues") {
    return { type: "issue", owner, repo, number };
  }

  const err: any = new Error("unsupported_github_url");
  err.status = 400;
  throw err;
}

function ghHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "MindMesh",
    "X-GitHub-Api-Version": "2022-11-28",
  } as const;
}

export async function fetchGitHubMeta(
  token: string,
  parsed: ParsedGitHubLink,
): Promise<GitHubIssueMeta | GitHubPRMeta> {
  if (parsed.type === "issue") {
    const res = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/issues/${parsed.number}`,
      { headers: ghHeaders(token) },
    );

    if (!res.ok) {
      const body = await res.text();
      const err: any = new Error("github_fetch_failed");
      err.status = res.status === 404 ? 404 : 400;
      err.details = body;
      throw err;
    }

    const data = (await res.json()) as any;

    return {
      type: "issue",
      owner: parsed.owner,
      repo: parsed.repo,
      number: data.number,
      title: data.title,
      author: data.user?.login ?? "unknown",
      state: String(data.state).toLowerCase() === "open" ? "OPEN" : "CLOSED",
      updatedAt: data.updated_at,
      htmlUrl: data.html_url,
    };
  }

  // PR
  const res = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.number}`,
    { headers: ghHeaders(token) },
  );

  if (!res.ok) {
    const body = await res.text();
    const err: any = new Error("github_fetch_failed");
    err.status = res.status === 404 ? 404 : 400;
    err.details = body;
    throw err;
  }

  const data = (await res.json()) as any;
  const merged = Boolean(data.merged_at);

  const state = merged
    ? "MERGED"
    : String(data.state).toLowerCase() === "open"
      ? "OPEN"
      : "CLOSED";

  return {
    type: "pr",
    owner: parsed.owner,
    repo: parsed.repo,
    number: data.number,
    title: data.title,
    author: data.user?.login ?? "unknown",
    state,
    merged,
    updatedAt: data.updated_at,
    htmlUrl: data.html_url,
  };
}
