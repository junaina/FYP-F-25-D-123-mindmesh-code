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
