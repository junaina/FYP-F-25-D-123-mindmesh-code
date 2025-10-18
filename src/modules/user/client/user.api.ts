export type MeForSidebar = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  initials: string;
  fallbackEmoji: string;
  fallbackColor: string;
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
};
