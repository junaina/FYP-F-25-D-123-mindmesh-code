// src/modules/integrations/github/services/githubAuth.service.ts
import { GitHubOauthIdentityRepo } from "../repo/githubOauthIdentity.repo";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_USER_URL = "https://api.github.com/user";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`missing_env_${name}`);
  return v;
}

export const GitHubAuthService = {
  buildAuthorizeUrl(args: { state: string }) {
    const clientId = requireEnv("GITHUB_CLIENT_ID");
    const redirectUri = requireEnv("GITHUB_REDIRECT_URI");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "read:user repo", // private repos in v1
      state: args.state,
    });

    return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
  },

  async handleCallback(args: { userId: string; code: string }) {
    const clientId = requireEnv("GITHUB_CLIENT_ID");
    const clientSecret = requireEnv("GITHUB_CLIENT_SECRET");
    const redirectUri = requireEnv("GITHUB_REDIRECT_URI");

    // 1) exchange code -> token
    const tokenRes = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: args.code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenJson = (await tokenRes.json()) as {
      access_token?: string;
      token_type?: string;
      scope?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error("GitHub token exchange failed", tokenJson);
      throw new Error("github_token_exchange_failed");
    }

    // 2) fetch GitHub user (to get stable providerUserId)
    const meRes = await fetch(GITHUB_API_USER_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokenJson.access_token}`,
        "User-Agent": "MindMesh",
      },
    });

    if (!meRes.ok) {
      const body = await meRes.text();
      console.error("GitHub /user failed", body);
      throw new Error("github_user_fetch_failed");
    }

    const gh = (await meRes.json()) as { id: number; login: string };
    const providerUserId = String(gh.id);

    // 3) store token in OauthIdentity
    await GitHubOauthIdentityRepo.upsertForUser({
      userId: args.userId,
      providerUserId,
      accessToken: tokenJson.access_token,
      scope: tokenJson.scope ?? null,
      tokenType: tokenJson.token_type ?? null,
    });

    return { providerUserId, login: gh.login };
  },

  async getStatus(args: { userId: string }) {
    const row = await GitHubOauthIdentityRepo.findForUser(args.userId);
    if (!row?.accessToken) return { connected: false as const };
    return {
      connected: true as const,
      providerUserId: row.providerUserId,
      scope: row.scope ?? null,
    };
  },
};
