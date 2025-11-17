// src/components/meeting/JoinMeetingClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import RecordingControls from "./RecordingControls";

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
  const router = useRouter();
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
      } catch (err) {
        console.error(err);
        const message =
          err instanceof Error ? err.message : "Failed to join meeting";
        setError(message);
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

  const handleDisconnected = () => {
    // When the user hits "Leave" in the LiveKit UI, redirect to recap screen
    router.replace(`/mesh-meet/${joinCode}/ended`);
  };
  // ✅ Actual LiveKit call UI with recording controls overlay
  return (
    <div className="h-screen w-full">
      <LiveKitRoom
        token={data.token}
        serverUrl={LIVEKIT_URL}
        connect={true}
        data-lk-theme="default"
        onDisconnected={handleDisconnected}
      >
        <div className="relative h-full w-full">
          {/* Overlay for recording controls */}
          <div className="pointer-events-none absolute inset-0 z-20">
            <div className="pointer-events-auto absolute right-4 top-4">
              <RecordingControls joinCode={joinCode} />
            </div>
          </div>

          {/* Built-in "Google Meet style" UI */}
          <VideoConference />
        </div>
      </LiveKitRoom>
    </div>
  );
}
