import { z } from "zod";

// Mirrors your GlobalUserPrefs model (minus created/updated timestamps)
export const PrefsZ = z.object({
  theme: z.enum(["system", "light", "dark"]),
});

export type Prefs = z.infer<typeof PrefsZ>;

// PATCH accepts partial (so UI can save field-by-field)
export const UpdatePrefsZ = PrefsZ.partial();
export type UpdatePrefsInput = z.infer<typeof UpdatePrefsZ>;
