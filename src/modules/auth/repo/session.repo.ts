import { prisma } from "@/lib/prisma";

export async function createSessionDB(params: {
  userId: string;
  ip?: string | null;
  ua?: string | null;
  expiresAt: Date;
}) {
  return prisma.session.create({
    data: {
      userId: params.userId,
      ip: params.ip ?? null,
      userAgent: params.ua ?? null,
      expiresAt: params.expiresAt,
    },
  });
}

export async function revokeSessionDB(sessionId: string) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessionsDB(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function findActiveSessionWithUserDB(sessionId: string) {
  const now = new Date();
  return prisma.session.findFirst({
    where: { id: sessionId, revokedAt: null, expiresAt: { gt: now } },
    include: { user: true },
  });
}
