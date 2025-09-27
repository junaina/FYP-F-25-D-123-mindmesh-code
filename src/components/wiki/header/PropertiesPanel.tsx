"use client";

import * as React from "react";
import type {
  PropertyDefinitionDto,
  PropertyValueDto,
} from "@/modules/documents/dto/doc.dto";
import PropertyRow from "./PropertyRow";
import AddPropertyButton from "./AddPropertyButton";
import { fetchDocHeader } from "@/modules/documents/client/docs.api";

type Props = {
  projectId: string;
  docId: string;
  properties: Array<
    PropertyDefinitionDto & { value?: PropertyValueDto | null }
  >;
  onCreated?: (p: PropertyDefinitionDto) => void;
  onDeleted?: (id: string) => void;
  onUpdated?: (p: PropertyDefinitionDto) => void;
};

export default function PropertiesPanel({
  projectId,
  docId,
  properties,
  onCreated,
  onUpdated,
  onDeleted,
}: Props) {
  const [list, setList] = React.useState(properties);

  // keep local list in sync when parent props change
  React.useEffect(() => setList(properties), [properties]);

  // central re-fetch
  const refresh = React.useCallback(async () => {
    try {
      const header = await fetchDocHeader(projectId, docId);
      setList(header?.properties ?? []);
    } catch (e) {
      console.error("Failed to refresh properties", e);
    }
  }, [projectId, docId]);

  // works with both () => void and (p: PropertyDefinitionDto) => void
  const handleCreated = React.useCallback(
    async (...args: unknown[]) => {
      const maybe = args[0] as PropertyDefinitionDto | undefined;
      if (maybe && onCreated) onCreated(maybe);
      await refresh();
    },
    [onCreated, refresh]
  );

  return (
    <section className="space-y-1">
      {list.map((def) => (
        <PropertyRow
          key={def.id}
          projectId={projectId}
          docId={docId}
          property={def}
          onUpdated={async (p) => {
            onUpdated?.(p);
            await refresh(); // ensure options/values are fresh
          }}
          onDeleted={async () => {
            onDeleted?.(def.id);
            await refresh();
          }}
        />
      ))}

      <div className="pt-2">
        <AddPropertyButton
          projectId={projectId}
          docId={docId}
          onCreated={handleCreated}
        />
      </div>
    </section>
  );
}
