"use client";

import * as React from "react";
import { fetchDocHeader } from "@/modules/documents/client/docs.api";
import type { DocHeaderDto } from "@/modules/documents/dto/doc.dto";
import PropertiesPanel from "@/components/wiki/header/PropertiesPanel";
import { useRouter } from "next/navigation";
import HeaderTitle from "@/components/wiki/header/HeaderTitle";
import { Separator } from "@/components/ui/separator";
type Props = {
  projectId: string;
  docId: string;
  initialHeader?: DocHeaderDto;
};

export default function HeaderWrapper({
  projectId,
  docId,
  initialHeader,
}: Props) {
  const router = useRouter();
  const [header, setHeader] = React.useState<DocHeaderDto | null>(
    initialHeader ?? null
  );
  const [loading, setLoading] = React.useState(!initialHeader);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("ClientDoc props:", projectId, docId);

      const h = (await fetchDocHeader(projectId, docId)) as DocHeaderDto;
      setHeader(h);
    } catch (e) {
      setError((e as Error).message || "Failed to load document");
      setHeader(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, docId]);

  React.useEffect(() => {
    if (!initialHeader) void load();
  }, [initialHeader, load]);

  if (loading)
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (error) return <div className="text-sm text-red-500">{error}</div>;
  if (!header) return <div className="text-sm">Not found.</div>;

  return (
    <div className="space-y-8">
      <HeaderTitle projectId={projectId} docId={docId} title={header.title} />

      {/*properties panel*/}
      <PropertiesPanel
        projectId={projectId}
        docId={docId}
        properties={header.properties}
        onCreated={() => {
          void load();
          router.refresh();
        }}
      />
    </div>
  );
}
