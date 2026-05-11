// src/modules/integrations/github/repo/githubOauthIdentity.repo.ts
import { prisma } from "@/lib/prisma";

const PROVIDER = "github" as const;

export const GitHubOauthIdentityRepo = {
  async findForUser(userId: string) {
    return prisma.oauthIdentity.findFirst({
      where: { userId, provider: PROVIDER },
      select: {
        id: true,
        userId: true,
        provider: true,
        providerUserId: true,
        accessToken: true,
        scope: true,
        tokenType: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  },

  async findByProviderUserId(providerUserId: string) {
    return prisma.oauthIdentity.findUnique({
      where: {
        provider_providerUserId: { provider: PROVIDER, providerUserId },
      },
      select: { id: true, userId: true, providerUserId: true },
    });
  },

  async upsertForUser(args: {
    userId: string;
    providerUserId: string;
    accessToken: string;
    scope?: string | null;
    tokenType?: string | null;
  }) {
    const { userId, providerUserId, accessToken, scope, tokenType } = args;

    // keep it “one GitHub account per user” for v1
    await prisma.oauthIdentity.deleteMany({
      where: {
        userId,
        provider: PROVIDER,
        NOT: { providerUserId },
      },
    });

    const existing = await prisma.oauthIdentity.findUnique({
      where: {
        provider_providerUserId: { provider: PROVIDER, providerUserId },
      },
      select: { id: true, userId: true },
    });

    if (existing && existing.userId !== userId) {
      const err: any = new Error("github_identity_already_linked");
      err.status = 409;
      throw err;
    }

    if (existing) {
      return prisma.oauthIdentity.update({
        where: { id: existing.id },
        data: {
          accessToken,
          scope: scope ?? null,
          tokenType: tokenType ?? null,
          refreshToken: null,
          expiresAt: null,
        },
      });
    }

    return prisma.oauthIdentity.create({
      data: {
        userId,
        provider: PROVIDER,
        providerUserId,
        accessToken,
        scope: scope ?? null,
        tokenType: tokenType ?? null,
        refreshToken: null,
        expiresAt: null,
      },
    });
  },
};
