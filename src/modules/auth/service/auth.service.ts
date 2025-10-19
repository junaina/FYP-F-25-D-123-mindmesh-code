import { hashPassword } from "@/lib/auth/password";
import * as Repo from "../repo/auth.repo";
import type { SignupDTO, SignupResult, UserSafe } from "../dto/signup.dto";
import { verifyPassword } from "@/lib/auth/password";
import type { LoginInput, LoginResult } from "../dto/login.dto";
import * as UserRepo from "@/modules/auth/repo/auth.repo";
import * as SessionRepo from "../repo/session.repo";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import * as OauthRepo from "../repo/oauth.repo";
import { authRepo } from "../repo/auth.repo";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
function toUserSafe(u: any): UserSafe {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    emailVerified: Boolean(u.emailVerifiedAt),
  };
}
export async function signup(
  input: SignupDTO,
  ctx: { ip?: string; ua?: string } = {}
): Promise<{ result: SignupResult; sessionId: string }> {
  const email = input.email.trim().toLowerCase();
  const existing = await Repo.findUserByEmail(email);
  if (existing) {
    const e: any = new Error("email_taken");
    e.status = 409;
    throw e;
  }
  try {
    const passwordHash = await hashPassword(input.password);
    const user = await UserRepo.createUser({ ...input, email, passwordHash });

    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
    const session = await SessionRepo.createSessionDB({
      userId: user.id,
      ip: ctx.ip ?? null,
      ua: ctx.ua ?? null,
      expiresAt,
    });
    return { result: { user: toUserSafe(user) }, sessionId: session.id };
  } catch (e: any) {
    // Prisma unique violation
    if (
      e?.code === "P2002" &&
      Array.isArray(e?.meta?.target) &&
      e.meta.target.includes("email")
    ) {
      const err: any = new Error("email_taken");
      err.status = 409;
      throw err;
    }
    throw e;
  }
}

export async function login(
  input: LoginInput,
  ctx: { ip?: string; ua?: string } = {}
): Promise<{ result: LoginResult; sessionId: string }> {
  const email = input.email.trim().toLowerCase();
  const user = await UserRepo.findUserByEmail(email);
  if (!user || !user.passwordHash) {
    const e: any = new Error("invalid_credentials");
    e.status = 401;
    throw e;
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    const e: any = new Error("invalid_credentials");
    e.status = 401;
    throw e;
  }

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const session = await SessionRepo.createSessionDB({
    userId: user.id,
    ip: ctx.ip ?? null,
    ua: ctx.ua ?? null,
    expiresAt,
  });

  return { result: { user: toUserSafe(user) }, sessionId: session.id };
}

//reads a sesh id and returns the safe user or null
export async function getMeFromSessionId(
  sessionId: string
): Promise<UserSafe | null> {
  const s = await SessionRepo.findActiveSessionWithUserDB(sessionId);
  if (!s?.user) return null;
  return toUserSafe(s.user);
}

////////////OAUTH/////////////////

export function googleAuthUrl(state: string) {
  // IMPORTANT: do NOT generate state here. Use the state that was created in the route.
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "openid email profile",
    include_granted_scopes: "true",
    prompt: "consent",
    state, // ← use the state provided by the route
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function googleCallback(params: {
  code: string;
  state?: string;
  ip?: string;
  ua?: string;
}) {
  //exchange code for tokens
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: params.code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("google_token_exchange_failed");
  const tokens = (await res.json()) as { id_token: string };
  //decode id_token
  const payload = JSON.parse(
    Buffer.from(tokens.id_token.split(".")[1], "base64").toString()
  );
  const provider = "google";
  const providerUserId = payload.sub as string;
  const email = String(payload.email ?? "")
    .trim()
    .toLowerCase();
  const emailVerified = Boolean(payload.email_verified);
  const firstName = String(payload.given_name ?? "User");
  const lastName = String(payload.family_name ?? "");

  //find or create user
  const identity = await OauthRepo.findOauthIdentity(provider, providerUserId);
  let user = identity?.user;

  if (!user) {
    // Try by email first (user may have signed up with password)
    if (email) {
      user = (await OauthRepo.findUserByEmail(email)) ?? undefined;
    }
    if (!user) {
      user = await OauthRepo.createOauthUser({
        email,
        firstName,
        lastName,
        emailVerified,
      });
    }
    // Ensure identity is linked
    await OauthRepo.linkOauthIdentity(user.id, provider, providerUserId);
  }

  // 4) Create session
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const session = await SessionRepo.createSessionDB({
    userId: user.id,
    ip: params.ip ?? null,
    ua: params.ua ?? null,
    expiresAt,
  });

  return { sessionId: session.id, user };
}

export async function getAuthCapabilities(userId: string) {
  const [hasPassword, providers] = await Promise.all([
    authRepo.hasLocalPassword(userId),
    authRepo.listOauthProviders(userId),
  ]);
  return { hasPassword, providers };
}
export async function logout(sessionId: string) {
  // revoke only this session
  await SessionRepo.revokeSessionDB(sessionId);
}

export async function logoutAll(userId: string) {
  // revoke all sessions for this user (other devices too)
  await SessionRepo.revokeAllSessionsDB(userId);
}
