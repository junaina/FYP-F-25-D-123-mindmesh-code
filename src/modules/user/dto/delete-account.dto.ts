import { z } from "zod";

export const DeleteAccountZ = z.object({
  hard: z.boolean().default(true),
});
export type DeleteAccountInput = z.infer<typeof DeleteAccountZ>;
