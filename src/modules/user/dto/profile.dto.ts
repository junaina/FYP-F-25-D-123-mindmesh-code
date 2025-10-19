import { z } from "zod";

export const UpdateProfileZ = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  // optional; empty string will be converted to null in service
  avatarUrl: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .max(512)
    .optional()
    .or(z.literal("").optional()),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileZ>;
