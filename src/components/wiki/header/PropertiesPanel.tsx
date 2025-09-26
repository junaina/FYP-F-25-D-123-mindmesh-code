"use client";
import * as React from "react";
import type { PropertyDefinitionDto } from "@/modules/documents/dto/doc.dto";
import PropertyRow from "./PropertyRow";
import AddPropertyButton from "./AddPropertyButton";

type Props = {
  projectId: string;
  docId: string;
  properties: PropertyDefinitionDto[];
  onCreated?: () => void; // call router.refresh from parent if you like
  // values?:
};

export default function PropertiesPanel({
  projectId,
  docId,
  properties,
  onCreated,
}: // values = {},
Props) {
  return (
    <section className="space-y-1">
      {properties.map((p) => (
        <PropertyRow
          key={p.id}
          name={p.name}
          type={p.type}
          //value
        />
        //later: will pass actual vals for this doc e.g, value= {values[p.id]}
      ))}
      <div className="pt-2">
        <AddPropertyButton
          projectId={projectId}
          docId={docId}
          onCreated={onCreated}
        />
      </div>
    </section>
  );
}
