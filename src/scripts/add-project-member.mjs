// src/scripts/add-project-member.mjs
import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

// 👇 use your real IDs
const PROJECT_ID = "2b87519b-39cf-4101-b444-67d64d1332ae";
const USER_ID = "2a9658f7-a6ba-4ec4-9ac8-244ca448cbcb";

async function main() {
  const project = await prisma.project.findUnique({
    where: { id: PROJECT_ID },
  });
  if (!project) throw new Error(`Project not found: ${PROJECT_ID}`);

  const user = await prisma.user.findUnique({ where: { id: USER_ID } });
  if (!user) throw new Error(`User not found: ${USER_ID}`);

  console.log(
    `Found project "${project.name}" and user "${user.firstName} ${user.lastName}"`
  );

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: PROJECT_ID, userId: USER_ID } },
  });

  if (existing) {
    console.log("User is already a member of this project ✅");
    return;
  }

  await prisma.projectMember.create({
    data: {
      projectId: PROJECT_ID,
      userId: USER_ID,
      role: "MEMBER",
    },
  });

  console.log(`Linked user ${USER_ID} to project ${PROJECT_ID} as MEMBER ✅`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
