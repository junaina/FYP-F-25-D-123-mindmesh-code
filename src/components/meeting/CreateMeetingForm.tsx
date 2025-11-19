"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProjectMeeting,
  type MeetingSummary,
} from "@/modules/meetings/client/meetings.api";
import CreatedMeetingCard from "./CreatedMeetingCard";

type Props = {
  projectId: string;
};

export default function CreateMeetingForm({ projectId }: Props) {
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<MeetingSummary | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim() || "Untitled meeting";

    try {
      setCreating(true);
      setError(null);
      const meeting = await createProjectMeeting(projectId, trimmed);
      setCreated(meeting);
      setTitle("");
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to create meeting");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-card p-4 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="meeting-title">Meeting title</Label>
          <Input
            id="meeting-title"
            placeholder="Sprint planning, 1:1, customer demo..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create meeting"}
        </Button>
      </form>

      {created && <CreatedMeetingCard meeting={created} />}
    </>
  );
}
