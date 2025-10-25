import { prisma } from "@/lib/prisma";
import type { UpdatePrefsInput } from "../dto/preferences.dto";

export async function getByUserId(userId: string) {
  return prisma.globalUserPrefs.upsert({
    where: { userId },
    create: {
      userId,
      theme: "system",
    },
    update: {},
    select: {
      theme: true,
    },
  });
}

export async function updateByUserId(userId: string, input: UpdatePrefsInput) {
  return prisma.globalUserPrefs.update({
    where: { userId },
    data: input,
    select: {
      theme: true,
    },
  });
}
