import { z } from "zod";
export const RenameProjectInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be at most 120 characters"),
});
export type RenameProjectInput = z.infer<typeof RenameProjectInputSchema>;
