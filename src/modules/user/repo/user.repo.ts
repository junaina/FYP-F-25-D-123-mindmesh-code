import { prisma } from "@/lib/prisma";

export const userRepo = {
  // just what we need for the sidebar
  async findAvatarById(userId: string) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });
    return { avatarUrl: u?.avatarUrl ?? null };
  },
  updateName: async (userId: string, firstName: string, lastName: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
      },
    });
  },
  updateAvatar: async (userId: string, avatarUrl: string | null) => {
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
      },
    });
  },
  updateProfile: async (
    userId: string,
    data: { firstName: string; lastName: string; avatarUrl?: string | null }
  ) => {
    const updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
    };
    // only touch avatarUrl if it was supplied (can be null)
    if ("avatarUrl" in data) updateData.avatarUrl = data.avatarUrl;

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
      },
    });
  },
};
