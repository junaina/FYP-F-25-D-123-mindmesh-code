export const accountApi = {
  async security() {
    const r = await fetch("/api/account/security", { cache: "no-store" });
    if (!r.ok) throw new Error("Failed to load security capabilities");
    return (await r.json()) as { hasPassword: boolean; providers: string[] };
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const r = await fetch("/api/auth/password", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      throw new Error(
        body?.error ?? body?.message ?? "Failed to change password",
      );
    }
    return (await r.json()) as { success: true };
  },
  async logout() {
    const r = await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("mm-swr-cache-v1");

    if (!r.ok) throw new Error("Logout failed");
  },

  async logoutAll() {
    const r = await fetch("/api/auth/logout-all", { method: "POST" });
    localStorage.removeItem("mm-swr-cache-v1");

    if (!r.ok) throw new Error("Logout all failed");
  },
};
