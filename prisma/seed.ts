import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1) a demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@acme.com" },
    update: {},
    create: {
      firstName: "Demo",
      lastName: "User",
      email: "demo@acme.com",
      passwordHash: "dev-only", // placeholder
      status: "ACTIVE",
    },
  });

  // 2) a demo project (owned by demo user)
  const project = await prisma.project.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo Project",
      slug: "demo",
      createdById: user.id,
      visibility: "PRIVATE",
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
    include: { members: true },
  });

  // 3) a root document
  const readme = await prisma.document.create({
    data: {
      projectId: project.id,
      title: "Project README",
      content: { type: "doc", content: [] },
      createdById: user.id,
    },
  });

  // 4) a child document under README
  const setup = await prisma.document.create({
    data: {
      projectId: project.id,
      title: "Setup Guide",
      parentId: readme.id,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello Wiki!" }],
          },
        ],
      },
      createdById: user.id,
    },
  });

  console.log("Seed done ✅");
  console.log({
    userId: user.id,
    projectId: project.id,
    readmeId: readme.id,
    setupId: setup.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
