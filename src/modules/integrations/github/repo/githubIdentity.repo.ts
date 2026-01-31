// src/modules/integrations/github/repo/githubIdentity.repo.ts
import { prisma } from "@/lib/prisma";

const PROVIDER = "github" as const;

export const GitHubIdentityRepo = {
  async getAccessTokenForUser(userId: string): Promise<string | null> {
    const row = await prisma.oauthIdentity.findFirst({
      where: { userId, provider: PROVIDER },
      select: { accessToken: true },
    });
    return row?.accessToken ?? null;
  },
};
