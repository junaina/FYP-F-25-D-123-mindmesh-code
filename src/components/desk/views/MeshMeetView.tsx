"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import CreateMeetingForm from "@/components/meeting/CreateMeetingForm";
import JoinMeetingClient from "@/components/meeting/JoinMeetingClient";

type Props = {
  id: string; // stable per project (usually projectId)
  params: { projectId: string };
  className?: string;
};

export default function MeshMeetView({ params, className }: Props) {
  const projectId = params?.projectId;
  const [joinCode, setJoinCode] = useState<string | null>(null);

  if (!projectId) {
    return (
      <div className="p-4 text-sm text-red-500">
        Missing <code>projectId</code> for MeshMeetView.
      </div>
    );
  }

  return (
    <div className={"h-full min-h-0 " + (className ?? "")}>
      {/* Lobby/Create */}
      <div className={joinCode ? "hidden" : "h-full min-h-0 overflow-auto p-6"}>
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl font-semibold">Mesh Meet</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Create a shareable video meeting link for this project. Anyone with
            the link can join.
          </p>
        </div>

        <div className="max-w-3xl">
          <CreateMeetingForm
            projectId={projectId}
            embedded
            onOpenRoom={(code) => setJoinCode(code)}
          />
        </div>
      </div>

      {/* Meeting room */}
      <div className={!joinCode ? "hidden" : "h-full min-h-0 flex flex-col"}>
        <div className="shrink-0 border-b bg-background/60 backdrop-blur px-3 py-2 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setJoinCode(null)}>
            ← Back
          </Button>
          <div className="text-sm text-muted-foreground">
            {joinCode ? (
              <>
                Join code: <code>{joinCode}</code>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {joinCode && (
            <JoinMeetingClient
              joinCode={joinCode}
              embedded
              onExitToLobby={() => setJoinCode(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
