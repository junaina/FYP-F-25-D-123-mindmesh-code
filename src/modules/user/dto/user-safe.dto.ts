import { z } from "zod";

export const UserSafeSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
});

export type UserSafe = z.infer<typeof UserSafeSchema>;
