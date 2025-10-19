import { z } from "zod";

export const MeResponseSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable(),
  initials: z.string().min(1).max(3),
  fallbackEmoji: z.string().min(1).max(3),
  fallbackColor: z.string(),
});

export type MeResponseDto = z.infer<typeof MeResponseSchema>;
