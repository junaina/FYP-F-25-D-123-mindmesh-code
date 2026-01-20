import type { SignupDTO, SignupResult, UserSafe } from "../dto/signup.dto";
import type { LoginInput, LoginResult } from "../dto/login.dto";

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    const err = new Error((data as any)?.error ?? "request_failed");
    (err as any).status = res.status;
    throw err;
  }
  return data as T;
}

export const AuthAPI = {
  async login(input: LoginInput): Promise<LoginResult> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    return parse<LoginResult>(res);
  },
  async signup(input: SignupDTO): Promise<SignupResult> {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    
    return parse<SignupResult>(res);
  },
  async me(): Promise<UserSafe | null> {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 401) return null;
    
    return parse<UserSafe>(res);
  },


  startGoogleOAuth(next?: string) {
    const url = next
      ? `/api/auth/oauth/google?next=${encodeURIComponent(next)}`
      : "/api/auth/oauth/google";
    window.location.href = url;
  },
};
