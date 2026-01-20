// src/app/(app)/mesh-meet/[joinCode]/ended/page.tsx

import MeetingEndScreen from "@/components/meeting/MeetingEndScreen";

type PageProps = {
  params: { joinCode: string };
};

export default function MeetingEndedPage({ params }: PageProps) {
  return (
    <div className="h-full w-full">
      <MeetingEndScreen joinCode={params.joinCode} />
    </div>
  );
}
