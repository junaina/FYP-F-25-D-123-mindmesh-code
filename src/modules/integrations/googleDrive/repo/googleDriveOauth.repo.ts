// src/modules/integrations/googleDrive/repo/googleDriveOauth.repo.ts
import { prisma } from "@/lib/prisma";

export const GoogleDriveOauthRepo = {
  async findForUser(userId: string) {
    return prisma.oauthIdentity.findFirst({
      where: { userId, provider: "google" },
    });
  },

  async upsertGoogleDriveTokens(params: {
    userId: string;
    providerUserId: string;
    accessToken?: string | null;
    refreshToken?: string | null;
    scope?: string | null;
    tokenType?: string | null;
    expiresAt?: Date | null;
  }) {
    const {
      userId,
      providerUserId,
      accessToken,
      refreshToken,
      scope,
      tokenType,
      expiresAt,
    } = params;

    return prisma.oauthIdentity.upsert({
      where: {
        provider_providerUserId: {
          provider: "google",
          providerUserId,
        },
      },
      update: {
        userId,
        accessToken,
        refreshToken,
        scope,
        tokenType,
        expiresAt,
      },
      create: {
        userId,
        provider: "google",
        providerUserId,
        accessToken,
        refreshToken,
        scope,
        tokenType,
        expiresAt,
      },
    });
  },
};
