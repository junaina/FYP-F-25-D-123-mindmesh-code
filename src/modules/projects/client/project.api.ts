export type ProjectLite = {
  id: string;
  name: string;
  visibility: "PRIVATE" | "LINK" | "ORG";
};

export const projectsApi = {
  async list(): Promise<ProjectLite[]> {
    const res = await fetch("/api/projects", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to load projects");
    return res.json();
  },
  async create(name: string): Promise<ProjectLite> {
    const res = await fetch("/api/projects", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "Failed to create project");
    }
    return res.json();
  },
};
