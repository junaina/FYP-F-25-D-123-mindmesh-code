import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as UserService from "@/modules/user/service/user.service";
import * as AuthService from "@/modules/auth/service/auth.service";
import { ChangePasswordZ } from "@/modules/user/dto/password.dto";
import { ok, badRequest } from "@/lib/auth/responses";

export async function PUT(req: NextRequest) {
  try {
    const sid = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!sid) return badRequest("unauthorized");

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) return badRequest("unauthorized");

    const input = ChangePasswordZ.parse(await req.json());
    const result = await UserService.changePassword(me.id, input);
    return ok(result);
  } catch (e: any) {
    return badRequest(e?.message ?? "bad_request");
  }
}
