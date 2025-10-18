import { cookies } from "next/headers";

const OAUTH_STATE_COOKIE = "mm_oauth_state";
const OAUTH_STATE_TTL_SEC = 5 * 60; // 5 minutes

const b64u = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const unb64u = (s: string) => Buffer.from(s, "base64url").toString("utf8");

export async function createOauthState(
  nextPath: string = "/home"
): Promise<string> {
  const nonce = crypto.randomUUID();
  const safeNext = nextPath.startsWith("/")
    ? nextPath.replace(/\s+/g, "").replace(/\.+$/, "")
    : "/home";
  const payload = JSON.stringify({ n: nonce, t: Date.now(), next: safeNext });

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_STATE_TTL_SEC,
  });

  return b64u(payload);
}

export async function verifyOauthState(
  state: string
): Promise<
  | { ok: true; next: string }
  | { ok: false; reason: "bad_state" | "nonce_mismatch" | "state_expired" }
> {
  try {
    const payload = JSON.parse(unb64u(state)) as {
      n: string;
      t: number;
      next?: string;
    };
    const cookieStore = await cookies();
    const nonce = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
    if (!nonce || nonce !== payload.n)
      return { ok: false, reason: "nonce_mismatch" };
    if (Date.now() - payload.t > OAUTH_STATE_TTL_SEC * 1000)
      return { ok: false, reason: "state_expired" };

    // one-time use
    cookieStore.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    const nextRaw = payload.next || "/home";
    const next = nextRaw.startsWith("/")
      ? nextRaw.replace(/\s+/g, "").replace(/\.+$/, "")
      : "/home";

    return { ok: true, next };
  } catch {
    return { ok: false, reason: "bad_state" };
  }
}
