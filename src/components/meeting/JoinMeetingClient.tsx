"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";

type Props = {
  joinCode: string;
};

type TokenResponse = {
  token: string;
  roomName: string;
  meeting: {
    id: string;
    title: string;
  };
};

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL;

export default function JoinMeetingClient({ joinCode }: Props) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(`/api/meet/${joinCode}/token`, {
          credentials: "include",
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Failed with status ${res.status}`);
        }

        const json = (await res.json()) as TokenResponse;
        setData(json);
        setState("ready");
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? "Failed to join meeting");
        setState("error");
      }
    }

    run();
  }, [joinCode]);

  if (!LIVEKIT_URL) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-500">
          Missing LIVEKIT_WS_URL env variable.
        </p>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Connecting to meeting…</p>
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-2 text-center">
          <p className="font-medium">Could not join meeting</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // ✅ Actual LiveKit call UI
  return (
    <div className="h-screen w-full">
      <LiveKitRoom
        token={data.token}
        serverUrl={LIVEKIT_URL}
        connect={true}
        data-lk-theme="default"
      >
        {/* Built-in "Google Meet style" UI */}
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
