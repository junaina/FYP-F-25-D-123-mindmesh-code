import { headers, cookies } from "next/headers";

export async function getProjectDashboardServer(projectId: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const c = await cookies();
  const cookieHeader = c
    .getAll()
    .map((x) => `${x.name}=${x.value}`)
    .join("; ");

  const res = await fetch(`${origin}/api/projects/${projectId}/dashboard`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("not_found");
    if (res.status === 401) throw new Error("unauthorized");
    throw new Error("failed");
  }
  return res.json() as Promise<{
    project: {
      id: string;
      name: string;
      slug: string | null;
      visibility: "PRIVATE" | "LINK" | "ORG";
    };
    documents: {
      id: string;
      title: string | null;
      updatedAt: string;
      project: { id: string; name: string; slug: string | null };
    }[];
  }>;
}
