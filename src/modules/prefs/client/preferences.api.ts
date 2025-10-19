export type ThemeChoice = "system" | "light" | "dark";

export const preferencesApi = {
  async get() {
    const r = await fetch("/api/preferences", { cache: "no-store" });
    if (!r.ok) throw new Error("Failed to load preferences");
    return r.json() as Promise<{ theme: ThemeChoice }>;
  },
  async setTheme(theme: ThemeChoice) {
    const r = await fetch("/api/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ theme }),
    });
    if (!r.ok) throw new Error("Failed to save theme");
    return r.json() as Promise<{ theme: ThemeChoice }>;
  },
};
