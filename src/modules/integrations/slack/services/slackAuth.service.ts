import * as SlackIdentityRepo from "@/modules/integrations/slack/repo/slackIdentity.repo";
import * as SlackApi from "./slackApi.service";

const SLACK_AUTHORIZE_URL = "https://slack.com/oauth/v2/authorize";
const SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access";

const DEFAULT_USER_SCOPES = [
  "chat:write",
  "channels:read",
  "groups:read",
  "users:read",
].join(",");
export const SLACK_OAUTH_STATE_COOKIE = "slack_oauth_state";
export const SLACK_OAUTH_RETURNTO_COOKIE = "slack_oauth_returnto";

export function buildAuthorizeUrl(params: { state: string }) {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;
  const clientMissing = !clientId || !redirectUri;
  if (clientMissing) throw new Error("slack_env_missing");

  const userScope = process.env.SLACK_USER_SCOPES ?? DEFAULT_USER_SCOPES;

  const qs = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri!,
    state: params.state,
    // Request USER token scopes (slash-menu UX is better as user)
    user_scope: userScope,
  });

  return new URL(`${SLACK_AUTHORIZE_URL}?${qs.toString()}`);
}

export async function handleCallback(params: { userId: string; code: string }) {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("slack_env_missing");
  }

  const res = await fetch(SLACK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: params.code,
      redirect_uri: redirectUri,
    }),
  });

  const json = (await res.json()) as any;
  if (!res.ok || !json?.ok) {
    console.error("slack oauth exchange failed", json);
    throw new Error(json?.error ?? "slack_oauth_exchange_failed");
  }

  // OAuth v2: user token is in authed_user.access_token
  const providerUserId: string | undefined = json?.authed_user?.id;
  const accessToken: string | undefined = json?.authed_user?.access_token;
  const scope: string | undefined = json?.authed_user?.scope;

  if (!providerUserId || !accessToken) {
    throw new Error("slack_missing_user_token");
  }

  await SlackIdentityRepo.upsertSlackIdentityForUser({
    userId: params.userId,
    providerUserId,
    accessToken,
    scope: scope ?? null,
    tokenType: "user",
    expiresAt: null, // Slack tokens typically don't expire
  });
}

export async function getStatus(params: { userId: string }) {
  const identity = await SlackIdentityRepo.findSlackIdentityByUserId(
    params.userId,
  );
  if (!identity?.accessToken) return { connected: false as const };

  const test = await SlackApi.authTest(identity.accessToken);
  if (!test.ok) return { connected: false as const };

  return {
    connected: true as const,
    user: test.user,
    team: test.team,
  };
}

export async function requireUserToken(userId: string) {
  const identity = await SlackIdentityRepo.findSlackIdentityByUserId(userId);
  if (!identity?.accessToken) {
    const e: any = new Error("SLACK_NOT_CONNECTED");
    e.status = 409;
    throw e;
  }
  return identity.accessToken;
}
