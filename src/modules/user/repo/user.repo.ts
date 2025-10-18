import { prisma } from "@/lib/prisma";

export const userRepo = {
  // just what we need for the sidebar
  findAvatarById: async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });
  },
};
