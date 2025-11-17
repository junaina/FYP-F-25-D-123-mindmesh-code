// src/modules/meetings/client/meetings.api.ts

export type MeetingStatus = "SCHEDULED" | "LIVE" | "ENDED";

export type MeetingSummary = {
  id: string;
  title: string;
  joinCode: string;
  joinUrl: string;
  status: MeetingStatus;
  createdAt: string;
};

export type MeetingRecordingStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED";

export type MeetingRecordingSummary = {
  id: string;
  meetingId: string;
  egressId: string;
  s3Key: string;
  status: MeetingRecordingStatus;
  createdAt: string;
  updatedAt: string;
};

export type StartStopRecordingResponse = {
  recording: MeetingRecordingSummary;
};

export type RecordingStatusResponse = {
  recording: MeetingRecordingSummary | null;
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

/**
 * Start a LiveKit recording for a meeting identified by joinCode.
 *
 * Calls: POST /api/meet/:joinCode/recording/start
 *
 * Assumes the API returns:
 *   { recording: { ...MeetingRecordingSummary } }
 */
export async function startMeetingRecording(
  joinCode: string
): Promise<StartStopRecordingResponse> {
  if (!joinCode) {
    throw new Error("startMeetingRecording: missing joinCode");
  }

  const url = `/api/meet/${encodeURIComponent(joinCode)}/recording/start`;

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to start recording (${res.status}): ${
        text || res.statusText || "Unknown error"
      }`
    );
  }

  const json = (await res.json()) as StartStopRecordingResponse;
  return json;
}

/**
 * Stop the LiveKit recording for a meeting identified by joinCode.
 *
 * Calls: POST /api/meet/:joinCode/recording/stop
 *
 * Assumes the API returns:
 *   { recording: { ...MeetingRecordingSummary } }
 */
export async function stopMeetingRecording(
  joinCode: string
): Promise<StartStopRecordingResponse> {
  if (!joinCode) {
    throw new Error("stopMeetingRecording: missing joinCode");
  }

  const url = `/api/meet/${encodeURIComponent(joinCode)}/recording/stop`;

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to stop recording (${res.status}): ${
        text || res.statusText || "Unknown error"
      }`
    );
  }

  const json = (await res.json()) as StartStopRecordingResponse;
  return json;
}

/**
 * Get the latest recording status for a meeting by joinCode.
 * GET /api/meet/:joinCode/recording/status
 */
export async function getMeetingRecordingStatus(
  joinCode: string
): Promise<RecordingStatusResponse> {
  if (!joinCode) {
    throw new Error("getMeetingRecordingStatus: missing joinCode");
  }

  const url = `/api/meet/${encodeURIComponent(joinCode)}/recording/status`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch recording status (${res.status}): ${
        text || res.statusText || "Unknown error"
      }`
    );
  }

  const json = (await res.json()) as RecordingStatusResponse;
  return json;
}

/* ------------------------------------------------------------------ */
/*  Meeting recap (Phase 1)                                           */
/* ------------------------------------------------------------------ */

export type MeetingRecap = {
  meeting: {
    id: string;
    projectId: string;
    createdById: string;
    title: string;
    joinCode: string;
    livekitRoomName: string;
    status: MeetingStatus;
    hasRecording: boolean;
    hasTranscript: boolean;
    transcriptCreatedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  latestRecording: MeetingRecordingSummary | null;
};

/**
 * Fetch recap metadata for a meeting after it ends.
 * GET /api/meet/:joinCode/recap
 */
export async function getMeetingRecap(joinCode: string): Promise<MeetingRecap> {
  if (!joinCode) {
    throw new Error("getMeetingRecap: missing joinCode");
  }

  const url = `/api/meet/${encodeURIComponent(joinCode)}/recap`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch meeting recap (${res.status}): ${
        text || res.statusText || "Unknown error"
      }`
    );
  }

  const json = (await res.json()) as MeetingRecap;
  return json;
}
