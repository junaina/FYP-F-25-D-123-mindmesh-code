export type MeForSidebar = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  initials: string;
  fallbackEmoji: string;
  fallbackColor: string;
};
export type UpdateProfileInput = {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
};

export const userApi = {
  async meForSidebar(): Promise<MeForSidebar | null> {
    const res = await fetch("/api/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 401) return null;
    return (await res.json()) as MeForSidebar; // no parsing, per your preference
  },
  async updateProfile(input: UpdateProfileInput) {
    const res = await fetch("/api/me", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "Failed to update profile");
    }
    return res.json();
  },
  async deleteAccount() {
    const r = await fetch("/api/account", { method: "DELETE" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j?.error ?? "Failed to delete account");
    }
    return true;
  },
};
