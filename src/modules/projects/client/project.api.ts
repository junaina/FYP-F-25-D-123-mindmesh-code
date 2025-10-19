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
  async rename(projectId: string, name: string): Promise<ProjectLite> {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "Failed to rename project");
    }
    return res.json();
  },
  async remove(projectId: string): Promise<{ id: string }> {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "Failed to delete project");
    }
    return res.json();
  },
};
