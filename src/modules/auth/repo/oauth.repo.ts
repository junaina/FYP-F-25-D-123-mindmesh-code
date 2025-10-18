import { prisma } from "@/lib/prisma";

export async function findOauthIdentity(
  provider: string,
  providerUserId: string
) {
  return prisma.oauthIdentity.findUnique({
    where: { provider_providerUserId: { provider, providerUserId } },
    include: { user: true },
  });
}

export async function linkOauthIdentity(
  userId: string,
  provider: string,
  providerUserId: string
) {
  return prisma.oauthIdentity.create({
    data: { userId, provider, providerUserId },
  });
}
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createOauthUser(params: {
  email: string;
  firstName: string;
  lastName: string;
  emailVerified?: boolean;
}) {
  return prisma.user.create({
    data: {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      passwordHash: null,
      emailVerifiedAt: params.emailVerified ? new Date() : null,
    },
  });
}
