import { prisma } from "@/lib/prisma";
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash: data.passwordHash,
    },
  });
}
export const authRepo = {
  async hasLocalPassword(userId: string): Promise<boolean> {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    return !!u?.passwordHash;
  },

  async listOauthProviders(userId: string): Promise<string[]> {
    const rows = await prisma.oauthIdentity.findMany({
      where: { userId },
      select: { provider: true },
    });
    return rows.map((r) => r.provider); // e.g. ["google"]
  },
};
