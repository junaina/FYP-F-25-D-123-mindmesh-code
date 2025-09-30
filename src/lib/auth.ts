import { accessRepo } from "@/modules/documents/repo/access.repo";

export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

// Never allow this in production
export const isAuthDisabled = () =>
  process.env.AUTH_DISABLED === "true" && process.env.NODE_ENV !== "production";

export async function requireUser() {
  if (isAuthDisabled()) {
    await accessRepo.upsertDevUser(DEV_USER_ID, "dev@example.local");
    return { id: DEV_USER_ID, email: "dev@example.local" };
  }
  // TODO: plug real auth later (NextAuth, custom, etc.)
  throw new Error("Unauthorized");
}
