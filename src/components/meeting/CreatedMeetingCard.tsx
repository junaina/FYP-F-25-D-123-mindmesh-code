"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MeetingSummary } from "@/modules/meetings/client/meetings.api";

type Props = {
  meeting: MeetingSummary;
};

export default function CreatedMeetingCard({ meeting }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(meeting.joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore – clipboard can fail on some browsers
    }
  }

  return (
    <div className="mt-8 rounded-lg border bg-card p-4 shadow-sm space-y-3">
      <h2 className="font-medium">Meeting created</h2>

      <p className="text-sm">
        <span className="font-semibold">{meeting.title}</span>
        <span className="text-muted-foreground">
          {" "}
          · code <code>{meeting.joinCode}</code>
        </span>
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          readOnly
          value={meeting.joinUrl}
          className="sm:flex-1 bg-muted/40"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button asChild size="sm">
            <Link href={meeting.joinUrl}>Open room</Link>
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Share this link with anyone you want in the call. They don’t need a
        Mindmesh account to join.
      </p>
    </div>
  );
}
