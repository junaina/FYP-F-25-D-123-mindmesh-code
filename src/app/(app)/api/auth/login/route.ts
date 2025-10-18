// src/app/(app)/api/auth/login/route.ts
import type { NextRequest } from "next/server";
import { LoginZ } from "@/lib/auth/z";
import { ok, badRequest, serverError } from "@/lib/auth/responses";
import { limit } from "@/lib/auth/rateLimit";
import { getClientInfoFromRequest, setSessionCookie } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { isSecureRequest } from "@/lib/auth/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = LoginZ.safeParse(json);
    if (!parsed.success) {
      return badRequest("invalid_input", parsed.error.flatten());
    }
    const { ip, ua } = getClientInfoFromRequest(req);
    await limit(`login:${ip}:${parsed.data.email}`, 10 * 60 * 1000, 5);
    const { result, sessionId } = await AuthService.login(parsed.data, {
      ip,
      ua,
    });
    setSessionCookie(sessionId, isSecureRequest(req));
    return ok(result);
  } catch (err: any) {
    if (err?.status === 429) return badRequest("rate_limited");
    if (err?.status === 401 || err?.message === "invalid_credentials") {
      return new Response(JSON.stringify({ error: "invalid_credentials" }), {
        status: 401,
      });
    }
    console.error("login_error", err);
    return serverError();
  }
}
