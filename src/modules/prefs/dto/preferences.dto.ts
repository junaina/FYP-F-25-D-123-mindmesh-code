import { z } from "zod";

export const PrefsZ = z.object({
  theme: z.enum(["system", "light", "dark"]),
});

export type Prefs = z.infer<typeof PrefsZ>;

export const UpdatePrefsZ = PrefsZ.partial();
export type UpdatePrefsInput = z.infer<typeof UpdatePrefsZ>;
