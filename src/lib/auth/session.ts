import { cookies } from "next/headers";

export const SESSION_COOKIE = "mm_session";
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 30);
export const SESSION_MAX_AGE_SECONDS =
  Number(process.env.SESSION_TTL_DAYS ?? 30) * 24 * 60 * 60;

export function sessionCookieOptions(isSecure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function getClientInfo(req: Request) {
  const xf = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = xf || "0.0.0.0";
  const ua = req.headers.get("user-agent") || "unknown";
  return { ip, ua };
}

export async function setSessionCookie(sessionId: string, isSecure: boolean) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, sessionCookieOptions(isSecure));
}
export async function clearSessionCookie(isSecure: boolean) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(isSecure),
    maxAge: 0,
  });
}

export function getClientInfoFromRequest(req: Request) {
  const xf = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = xf || "0.0.0.0";
  const ua = req.headers.get("user-agent") || "unknown";
  return { ip, ua };
}
export function isSecureRequest(req: Request) {
  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    /* no-op */
  }
  const xf = req.headers.get("x-forwarded-proto");
  if (xf?.toLowerCase().includes("https")) return true;
  return process.env.NODE_ENV === "production";
}
