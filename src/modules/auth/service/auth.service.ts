import { hashPassword } from "@/lib/auth/password";
import { getClientInfo } from "@/lib/auth/session";
import * as Repo from "../repo/auth.repo";
import type { SignupDTO, SignupResult, UserSafe } from "../dto/signup.dto";
import { verifyPassword } from "@/lib/auth/password";
import type { LoginInput, LoginResult } from "../dto/login.dto";
import * as UserRepo from "@/modules/auth/repo/auth.repo";
import * as SessionRepo from "../repo/session.repo";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
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
