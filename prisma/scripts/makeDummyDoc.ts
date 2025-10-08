// prisma/scripts/makeDummyDoc.ts
import * as dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "../../src/generated/prisma"; // relative to prisma/scripts

const prisma = new PrismaClient();

async function main() {
  const projectId = process.env.PROJECT_ID ?? "550a35be-038d-4c7d-8cd2-fdd1044d1f38";
  const title = process.env.DOC_TITLE ?? "Dummy document from script";

  // use project's creator as createdById
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, createdById: true, name: true },
  });
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const doc = await prisma.document.create({
    data: {
      projectId,
      title,
      content: {}, // empty editor JSON
      description: "seeded dummy",
      createdById: project.createdById,
    },
  });

  console.log("✅ Created document:", {
    id: doc.id,
    title: doc.title,
    projectId: doc.projectId,
    createdAt: doc.createdAt,
  });
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
