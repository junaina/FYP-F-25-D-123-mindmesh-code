// src/app/(app)/api/auth/signup/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; //avoiding caching

import type { NextRequest } from "next/server";
import { SignupZ } from "@/lib/auth/z";
import {
  created,
  badRequest,
  conflict,
  serverError,
} from "@/lib/auth/responses";
import { limit } from "@/lib/auth/rateLimit";
import {
  setSessionCookie,
  getClientInfoFromRequest,
  isSecureRequest,
} from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = SignupZ.safeParse(json);
    if (!parsed.success)
      return badRequest("invalied_input", parsed.error.flatten());

    const { ip, ua } = getClientInfoFromRequest(req);
    await limit(`signup:${ip}:${parsed.data.email}`, 10 * 60 * 1000, 5);
    const { result, sessionId } = await AuthService.signup(parsed.data, {
      ip,
      ua,
    });
    await setSessionCookie(sessionId, isSecureRequest(req));
    return created(result);
  } catch (err: any) {
    if (err?.status === 429) return badRequest("rate_limited");
    if (err?.status === 409 || err?.message === "email_taken")
      return conflict("email_taken");
    console.error("signup_error", err);
    return serverError();
  }
}
