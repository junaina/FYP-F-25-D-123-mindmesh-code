/* eslint-disable no-console */
import { config } from "dotenv";
import path from "node:path";

// 1) load .env first, then override with .env.local if present
config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { Prisma, PrismaClient } from "../src/generated/prisma";
import { accessRepo } from "../src/modules/documents/repo/access.repo";

// ---------------------------------------------------------------------------
// env + dev-auth helpers
// ---------------------------------------------------------------------------
const prisma = new PrismaClient();

const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";
const PROJECT_ID = process.env.SEED_PROJECT_ID;
const AUTH_DISABLED =
  process.env.AUTH_DISABLED === "true" && process.env.NODE_ENV !== "production";

async function resolveSeedUserId(): Promise<string> {
  if (AUTH_DISABLED) {
    // Ensure the dev user exists (your accessRepo helper)
    await accessRepo.upsertDevUser(DEV_USER_ID, "dev@example.local");
    return DEV_USER_ID;
  }
  const uid = process.env.SEED_USER_ID;
  if (!uid) {
    throw new Error(
      "SEED_USER_ID is required when AUTH_DISABLED is not true (or NODE_ENV is production)."
    );
  }
  return uid;
}

// ---------------------------------------------------------------------------
// tiny helpers
// ---------------------------------------------------------------------------
async function ensurePropDefinition(name: string, type: string) {
  const existing = await prisma.propertyDefinition.findFirst({
    where: { projectId: PROJECT_ID!, name, type },
  });
  if (existing) return existing;
  return prisma.propertyDefinition.create({
    data: { projectId: PROJECT_ID!, name, type },
  });
}

async function ensureDocumentProperty(documentId: string, propertyId: string) {
  const link = await prisma.documentProperty.findFirst({
    where: { documentId, propertyId },
  });
  return (
    link ??
    prisma.documentProperty.create({
      data: { documentId, propertyId },
    })
  );
}

async function upsertDateValue(
  documentId: string,
  propertyId: string,
  dateISO: string
) {
  const existing = await prisma.documentPropertyValue.findFirst({
    where: { documentId, propertyId },
  });

  const dateVal = new Date(dateISO);

  if (existing) {
    await prisma.documentPropertyValue.update({
      where: { id: existing.id },
      data: { valueDate: dateVal }, // only touch the date column
    });
  } else {
    await prisma.documentPropertyValue.create({
      data: { documentId, propertyId, valueDate: dateVal },
    });
  }
}

async function upsertTextValue(
  documentId: string,
  propertyId: string,
  text: string
) {
  const existing = await prisma.documentPropertyValue.findFirst({
    where: { documentId, propertyId },
  });

  if (existing) {
    await prisma.documentPropertyValue.update({
      where: { id: existing.id },
      data: { valueString: text }, // only touch the string column
    });
  } else {
    await prisma.documentPropertyValue.create({
      data: { documentId, propertyId, valueString: text },
    });
  }
}

async function ensureVisibility(
  collectionId: string,
  propertyId: string,
  visible = true
) {
  const row = await prisma.viewPropertyVisibility.findFirst({
    where: { collectionId, propertyId },
  });
  if (row) {
    if (row.visible !== visible) {
      await prisma.viewPropertyVisibility.update({
        where: { id: row.id },
        data: { visible },
      });
    }
    return row;
  }
  return prisma.viewPropertyVisibility.create({
    data: { collectionId, propertyId, visible },
  });
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  if (!PROJECT_ID) throw new Error("SEED_PROJECT_ID is required");
  const USER_ID = await resolveSeedUserId();

  console.log(
    "Seeding calendar…",
    JSON.stringify({ PROJECT_ID, USER_ID, AUTH_DISABLED }, null, 2)
  );

  // Property definitions used by the calendar
  const dateProp = await ensurePropDefinition("date", "date"); // single-day
  const startProp = await ensurePropDefinition("start", "date"); // range
  const endProp = await ensurePropDefinition("end", "date"); // range
  const statusProp = await ensurePropDefinition("status", "text"); // simple text badge

  // Parent document that hosts the calendar
  const calendarPage = await prisma.document.create({
    data: {
      projectId: PROJECT_ID!,
      title: "Calendar Page",
      createdById: USER_ID,
      content: {} as Prisma.JsonObject,
    },
  });

  // Calendar collection (lives inside the parent document)
  const collection = await prisma.collection.create({
    data: {
      name: "Team Calendar",
      type: "calendar",
      documentId: calendarPage.id,
      createdById: USER_ID,
      // If your Collection model also requires projectId, uncomment:
      // projectId: PROJECT_ID!,
    },
  });

  // Event documents (these are the items shown on the calendar)
  const eventA = await prisma.document.create({
    data: {
      projectId: PROJECT_ID!,
      title: "Standup",
      createdById: USER_ID,
      content: {} as Prisma.JsonObject,
    },
  });
  const eventB = await prisma.document.create({
    data: {
      projectId: PROJECT_ID!,
      title: "Sprint",
      createdById: USER_ID,
      content: {} as Prisma.JsonObject,
    },
  });
  const eventC = await prisma.document.create({
    data: {
      projectId: PROJECT_ID!,
      title: "Standup", // duplicate title to show no uniqueness constraints
      createdById: USER_ID,
      content: {} as Prisma.JsonObject,
    },
  });

  // Link events to the calendar collection
  await prisma.collectionItem.createMany({
    data: [
      {
        collectionId: collection.id,
        documentId: eventA.id,
        addedById: USER_ID,
      },
      {
        collectionId: collection.id,
        documentId: eventB.id,
        addedById: USER_ID,
      },
      {
        collectionId: collection.id,
        documentId: eventC.id,
        addedById: USER_ID,
      },
    ],
    skipDuplicates: true,
  });

  // Values:
  // A) Single-day event → uses `date`
  await ensureDocumentProperty(eventA.id, dateProp.id);
  await upsertDateValue(eventA.id, dateProp.id, "2025-10-12T00:00:00.000Z");
  await ensureDocumentProperty(eventA.id, statusProp.id);
  await upsertTextValue(eventA.id, statusProp.id, "Planned");

  // B) Range event → uses `start` and `end`
  await ensureDocumentProperty(eventB.id, startProp.id);
  await ensureDocumentProperty(eventB.id, endProp.id);
  await upsertDateValue(eventB.id, startProp.id, "2025-10-10T00:00:00.000Z");
  await upsertDateValue(eventB.id, endProp.id, "2025-10-14T00:00:00.000Z");
  await ensureDocumentProperty(eventB.id, statusProp.id);
  await upsertTextValue(eventB.id, statusProp.id, "In Progress");

  // C) Another single-day, same name as A
  await ensureDocumentProperty(eventC.id, dateProp.id);
  await upsertDateValue(eventC.id, dateProp.id, "2025-10-12T00:00:00.000Z");
  await ensureDocumentProperty(eventC.id, statusProp.id);
  await upsertTextValue(eventC.id, statusProp.id, "Done");

  // Make `status` visible on this calendar
  await ensureVisibility(collection.id, statusProp.id, true);

  console.log("\n✅ Seed complete.\n");
  console.table([
    { key: "projectId", value: PROJECT_ID },
    { key: "parentDocId (calendar page)", value: calendarPage.id },
    { key: "collectionId", value: collection.id },
    { key: "eventA docId (single-day)", value: eventA.id },
    { key: "eventB docId (range)", value: eventB.id },
    { key: "eventC docId (single-day duplicate name)", value: eventC.id },
  ]);

  console.log("\n🔎 Try in Postman:");
  console.log(
    `GET /api/projects/${PROJECT_ID}/docs/${calendarPage.id}/collections/${collection.id}/calendar?from=2025-10-01&to=2025-11-01`
  );
  console.log(
    `GET /api/projects/${PROJECT_ID}/docs/${calendarPage.id}/collections/${collection.id}/calendar/properties`
  );
  console.log(
    `GET /api/projects/${PROJECT_ID}/docs/${calendarPage.id}/collections/${collection.id}/calendar/settings`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
