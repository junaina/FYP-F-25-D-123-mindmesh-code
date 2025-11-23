// src/modules/integrations/googleDrive/googleDriveAuth.service.ts
import jwt from "jsonwebtoken";
import { GoogleDriveOauthRepo } from "@/modules/integrations/googleDrive/repo/googleDriveOauth.repo";

type StatePayload = {
  action: "save_meeting_transcript_to_drive";
  joinCode: string;
};

export const GoogleDriveAuthService = {
  async exchangeCodeForTokens(code: string) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_DRIVE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    return (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      scope?: string;
      token_type?: string;
      expires_in?: number;
      id_token?: string;
    };
  },

  decodeIdToken(idToken: string | undefined): { sub: string } | null {
    if (!idToken) return null;
    return jwt.decode(idToken) as { sub: string } | null;
  },

  parseState(rawState: string | null): StatePayload | null {
    if (!rawState) return null;
    try {
      return JSON.parse(decodeURIComponent(rawState));
    } catch {
      return null;
    }
  },

  async handleCallback(args: {
    userId: string;
    code: string;
    state: string | null;
  }): Promise<{ redirectUrl: string }> {
    const { userId, code, state } = args;

    const tokenData = await this.exchangeCodeForTokens(code);
    const idInfo = this.decodeIdToken(tokenData.id_token);
    const providerUserId = idInfo?.sub ?? `user-${userId}`;

    const expiresAt =
      tokenData.expires_in != null
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : undefined;

    await GoogleDriveOauthRepo.upsertGoogleDriveTokens({
      userId,
      providerUserId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      scope: tokenData.scope ?? null,
      tokenType: tokenData.token_type ?? null,
      expiresAt: expiresAt ?? null,
    });

    const parsedState = this.parseState(state);

    // After connecting Drive, send user back to the meeting recap screen.
    if (
      parsedState &&
      parsedState.action === "save_meeting_transcript_to_drive"
    ) {
      const { joinCode } = parsedState;
      // We’ll have the client auto-call export again when it sees this flag.
      return {
        redirectUrl: `/mesh-meet/${encodeURIComponent(
          joinCode
        )}/ended?driveExport=resume`,
      };
    }

    return { redirectUrl: "/settings/integrations?googleDrive=connected" };
  },
};
