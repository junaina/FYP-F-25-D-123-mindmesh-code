import JoinMeetingClient from "@/components/meeting/JoinMeetingClient";

type PageProps = {
  params: { joinCode: string };
};

export default function JoinMeetingPage({ params }: PageProps) {
  return (
    <div className="h-screen w-full">
      <JoinMeetingClient joinCode={params.joinCode} />
    </div>
  );
}
