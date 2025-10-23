import { headers, cookies } from "next/headers";

/**
 * Client-side (browser) fetch. Use inside Client Components.
 */
export async function getHomeDataClient() {
  const res = await fetch("/api/home", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load home data");
  return res.json() as Promise<{
    projects: { id: string; name: string; slug: string | null }[];
    recentDocs: {
      id: string;
      title: string | null;
      updatedAt: string;
      project: { id: string; name: string; slug: string | null };
    }[];
  }>;
}

/**
 * Server-side (RSC) fetch. Builds absolute URL + forwards cookies.
 * This is what your /home Server Component should call.
 */
export async function getHomeDataServer() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const c = await cookies();
  const cookieHeader = c
    .getAll()
    .map((x) => `${x.name}=${x.value}`)
    .join("; ");

  const res = await fetch(`${origin}/api/home`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  });
  if (!res.ok) throw new Error("Failed to load home data");
  return res.json() as Promise<{
    projects: { id: string; name: string; slug: string | null }[];
    recentDocs: {
      id: string;
      title: string | null;
      updatedAt: string;
      project: { id: string; name: string; slug: string | null };
    }[];
  }>;
}
