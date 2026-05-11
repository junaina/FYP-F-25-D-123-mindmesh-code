import { MindyFloating } from "@/components/mindy-floating";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  return (
    <>
      {children}
      <MindyFloating projectId={params.projectId} />
    </>
  );
}
