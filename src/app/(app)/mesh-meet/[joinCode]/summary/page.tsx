// src/app/mesh-meet/[joinCode]/summary/page.tsx
import MeetingSummary from "@/components/meeting/MeetingSummary";

export default function MeetingSummaryPage({
  params,
}: {
  params: { joinCode: string };
}) {
  return <MeetingSummary joinCode={params.joinCode} />;
}
