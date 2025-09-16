import ClientDoc from "./ClientDoc";

type PageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function DocPage({ params }: PageProps) {
  const { slug, id } = await params; // ← important on Next 15
  return (
    <div className="p-6 space-y-4">
      {/* <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Project: {slug}</h1>
        <div className="text-xs opacity-60">docId: {id}</div>
      </div> */}
      <ClientDoc docId={id} />
    </div>
  );
}
