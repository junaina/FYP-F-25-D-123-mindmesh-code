export type MeetingStatus = "SCHEDULED" | "LIVE" | "ENDED";

export type Meeting = {
  id: string;
  title: string;
  joinCode: string;
  joinUrl: string;
  status: MeetingStatus | string;
  createdAt: Date;
};
