type SlackResponse<T> = T & { ok: boolean; error?: string };

async function slackGet<T>(
  token: string,
  method: string,
  params?: Record<string, string>,
): Promise<SlackResponse<T>> {
  const url = new URL(`https://slack.com/api/${method}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const json = (await res.json()) as SlackResponse<T>;
  return json;
}

async function slackPost<T>(
  token: string,
  method: string,
  body?: Record<string, any>,
): Promise<SlackResponse<T>> {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json()) as SlackResponse<T>;
  return json;
}

export async function authTest(token: string) {
  return slackPost<{
    user_id: string;
    user: string;
    team_id: string;
    team: string;
  }>(token, "auth.test");
}

export async function listChannels(token: string) {
  // Channels the USER is a member of (public+private), excluding archived.
  return slackGet<{
    channels: Array<{ id: string; name: string; is_private: boolean }>;
  }>(token, "users.conversations", {
    types: "public_channel,private_channel",
    exclude_archived: "true",
    limit: "200",
  });
}

export async function postMessage(
  token: string,
  channel: string,
  text: string,
) {
  return slackPost<{ channel: string; ts: string }>(token, "chat.postMessage", {
    channel,
    text,
    unfurl_links: false,
    unfurl_media: false,
  });
}

export async function getPermalink(
  token: string,
  channel: string,
  message_ts: string,
) {
  return slackGet<{ permalink: string }>(token, "chat.getPermalink", {
    channel,
    message_ts,
  });
}
