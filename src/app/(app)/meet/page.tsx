"use client";

import { useEffect, useMemo, useState } from "react";
import MeetingHeader from "@/components/meet/meeting-header";
import VideoGrid from "@/components/meet/video-grid";
import BottomToolbar from "@/components/meet/bottom-toolbar";
import RightToolbar from "@/components/meet/right-toolbar";
import { useWebRTC } from "@/components/meet/use-webrtc";

export default function MeetPage() {
  const {
    localStream,
    remoteStream,
    isMicOn,
    isCamOn,
    isScreenSharing,
    start,
    toggleMic,
    toggleCam,
    startScreenShare,
    stopScreenShare,
    createOffer,
    createAnswer,
    applyAnswer,
    leave,
  } = useWebRTC();

  // start camera on mount
  useEffect(() => {
    start().catch(() => {});
  }, [start]);

  const mainTile = useMemo(
    () => ({
      key: "main",
      stream: remoteStream ?? localStream,
      name: remoteStream ? "Remote" : "You",
      presenting: isScreenSharing,
      self: !remoteStream,
    }),
    [remoteStream, localStream, isScreenSharing]
  );

  const sideTiles = useMemo(
    () => [
      {
        key: "you",
        stream: localStream,
        name: "You",
        presenting: false,
        self: true,
      },
      ...(remoteStream
        ? [{ key: "remote", stream: remoteStream, name: "Remote" }]
        : []),
    ],
    [localStream, remoteStream]
  );

  // Manual signaling (dev only)
  const [offerText, setOfferText] = useState("");
  const [answerText, setAnswerText] = useState("");

  return (
    <div className="space-y-4">
      <MeetingHeader title="Project Alpha Meet" presenter="Fathima" />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-9">
          <VideoGrid main={mainTile} side={sideTiles} />
          <div className="mt-4 flex items-center justify-center">
            <BottomToolbar
              isMicOn={isMicOn}
              isCamOn={isCamOn}
              isScreenSharing={isScreenSharing}
              onToggleMic={toggleMic}
              onToggleCam={toggleCam}
              onShare={startScreenShare}
              onStopShare={stopScreenShare}
              onLeave={leave}
            />
          </div>

          <div className="mt-6 rounded-xl border border-border p-4">
            <div className="mb-2 text-sm font-medium">Manual signaling (dev only)</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <button
                  className="rounded-md bg-secondary px-3 py-2 text-sm"
                  onClick={async () => setOfferText(await createOffer())}
                >
                  Create Offer
                </button>
                <textarea
                  className="h-28 w-full rounded-md border border-border bg-background p-2 text-xs"
                  placeholder="Offer (copy this to the other peer)"
                  value={offerText}
                  onChange={(e) => setOfferText(e.target.value)}
                />
                <button
                  className="rounded-md bg-secondary px-3 py-2 text-sm"
                  onClick={async () => {
                    if (!answerText) return;
                    await applyAnswer(answerText);
                  }}
                >
                  Apply Answer
                </button>
              </div>
              <div className="space-y-2">
                <textarea
                  className="h-28 w-full rounded-md border border-border bg-background p-2 text-xs"
                  placeholder="Paste remote offer here"
                  onChange={(e) => setOfferText(e.target.value)}
                />
                <button
                  className="rounded-md bg-secondary px-3 py-2 text-sm"
                  onClick={async () => {
                    if (!offerText) return;
                    const ans = await createAnswer(offerText);
                    setAnswerText(ans);
                  }}
                >
                  Create Answer
                </button>
                <textarea
                  className="h-28 w-full rounded-md border border-border bg-background p-2 text-xs"
                  placeholder="Answer (send back to offerer)"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Use two browser tabs/machines. In Tab A click “Create Offer” and paste into Tab B (“Paste remote offer”). In Tab B click “Create Answer” and paste the answer back into Tab A (“Apply Answer”).
            </p>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-3">
          <RightToolbar
            people={[
              { id: "1", name: "Fathima", muted: false },
              { id: "2", name: "Jenelia", muted: true },
              { id: "3", name: "Joe Carlson", muted: false },
              { id: "4", name: "Lucy Sera", muted: false },
              { id: "5", name: "Sara Johns", muted: false },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
