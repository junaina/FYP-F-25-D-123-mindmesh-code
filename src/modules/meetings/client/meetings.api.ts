// src/modules/meetings/client/meetings.api.ts

export type MeetingSummary = {
  id: string;
  title: string;
  joinCode: string;
  joinUrl: string;
  status: "SCHEDULED" | "LIVE" | "ENDED";
  createdAt: string;
};

/**
 * Create a meeting inside a project.
 * Calls POST /api/projects/:projectId/meetings
 */
export async function createProjectMeeting(
  projectId: string,
  title: string
): Promise<MeetingSummary> {
  if (!projectId) throw new Error("createProjectMeeting: missing projectId");

  const url = `/api/projects/${encodeURIComponent(projectId)}/meetings`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to create meeting (${res.status}): ${
        text || res.statusText || "Unknown error"
      }`
    );
  }

  const json = (await res.json()) as { meeting: MeetingSummary };
  return json.meeting;
}
