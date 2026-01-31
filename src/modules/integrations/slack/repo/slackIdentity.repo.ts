import { prisma } from "@/lib/prisma";

const PROVIDER = "slack";

export async function findSlackIdentityByUserId(userId: string) {
  return prisma.oauthIdentity.findFirst({
    where: { userId, provider: PROVIDER },
  });
}

export async function upsertSlackIdentityForUser(params: {
  userId: string;
  providerUserId: string;
  accessToken: string;
  scope?: string | null;
  tokenType?: string | null;
  expiresAt?: Date | null;
}) {
  // keep only the latest slack identity per user (same pattern as your GitHub flow)
  await prisma.oauthIdentity.deleteMany({
    where: {
      userId: params.userId,
      provider: PROVIDER,
      NOT: { providerUserId: params.providerUserId },
    },
  });

  return prisma.oauthIdentity.upsert({
    where: {
      provider_providerUserId: {
        provider: PROVIDER,
        providerUserId: params.providerUserId,
      },
    },
    create: {
      userId: params.userId,
      provider: PROVIDER,
      providerUserId: params.providerUserId,
      accessToken: params.accessToken,
      scope: params.scope ?? null,
      tokenType: params.tokenType ?? "user",
      expiresAt: params.expiresAt ?? null,
    },
    update: {
      userId: params.userId,
      accessToken: params.accessToken,
      scope: params.scope ?? null,
      tokenType: params.tokenType ?? "user",
      expiresAt: params.expiresAt ?? null,
    },
  });
}
