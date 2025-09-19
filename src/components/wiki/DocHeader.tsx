"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import AddPropertyDialog from "./AddPropertyDialog";
import PropertyRow from "./PropertyRow";
import type {
  DocPropertyRow,
  PropertyDefinition,
  PropertyValue,
  PropertyType,
  PropertyOption,
} from "@/modules/documents/domain/types";
import { savePropertyOptions } from "@/modules/documents/client/docs.api";
export type DocHeaderProps = {
  docId: string;
  title: string;
  createdAt: string | Date;
  description?: string;

  properties?: DocPropertyRow[];

  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
  onPropertiesChange?: (rows: DocPropertyRow[]) => void;
  onSaveOptions?: (
    defId: string,
    opts: DocPropertyRow["definition"]["options"]
  ) => Promise<void> | void;
};

function formatDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function defaultValue(def: PropertyDefinition): PropertyValue {
  switch (def.type) {
    case "text":
      return { type: "text", value: null };
    case "number":
      return { type: "number", value: null };
    case "select":
      return { type: "select", value: null };
    case "multi_select":
      return { type: "multi_select", value: [] as string[] };
    case "date_time":
      return { type: "date_time", value: null };
    case "email":
      return { type: "email", value: null };
    case "person":
      return { type: "person", value: [] as string[] };
    case "file":
      return { type: "file", value: [] as string[] };
    case "checkbox":
      return { type: "checkbox", value: false };
    case "status":
      return { type: "status", value: null };
  }
}

export default function DocHeader({
  docId,
  title,
  createdAt,
  description = "",
  properties = [],
  onTitleChange,
  onDescriptionChange,
  onSaveOptions,
  onPropertiesChange,
}: DocHeaderProps) {
  // local echo while typing; parent is the source of truth
  const [localTitle, setLocalTitle] = useState(title || "Untitled");
  const [localDesc, setLocalDesc] = useState(description);

  // keep local echo in sync with parent updates (e.g., after fetch)
  useEffect(() => setLocalTitle(title || "Untitled"), [title]);
  useEffect(() => setLocalDesc(description || ""), [description]);

  const titleRef = useRef<HTMLDivElement>(null);
  const handleSaveOptions = useCallback(
    async (defId: string, opts: PropertyOption[] = []) => {
      // optimistic UI
      const prev = properties;
      const next = prev.map((r) =>
        r.definition.id === defId
          ? { ...r, definition: { ...r.definition, options: opts } }
          : r
      );
      onPropertiesChange?.(next);

      try {
        if (onSaveOptions) {
          await onSaveOptions(defId, opts);
        } else {
          await savePropertyOptions(docId, defId, opts ?? []); // <-- pass docId, ensure array
        }
      } catch (e) {
        console.error(e);
        // optional: revert UI
        onPropertiesChange?.(prev);
      }
    },
    [docId, properties, onPropertiesChange, onSaveOptions]
  );

  function handleTitleInput(e: React.FormEvent<HTMLDivElement>) {
    const text = (e.currentTarget.textContent ?? "").trim();
    const next = text.length ? text : "Untitled";
    setLocalTitle(next);
    onTitleChange?.(next);
  }
  function handleCreateProperty(def: {
    id: string;
    name: string;
    type: PropertyType;
    options?: PropertyOption[]; // may be missing
  }) {
    const fullDef: PropertyDefinition = {
      id: def.id,
      name: def.name,
      type: def.type,
      options: def.options ?? [], // normalize here
    };
    const nextRow: DocPropertyRow = {
      definition: fullDef,
      value: defaultValue(fullDef),
    };
    onPropertiesChange?.([...properties, nextRow]);
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div
        ref={titleRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onInput={handleTitleInput}
        className="outline-none text-4xl font-bold tracking-tight"
      >
        {localTitle}
      </div>

      {/* Core properties */}
      <div className="space-y-3">
        {/* Created */}
        <div className="flex items-center gap-3 text-sm">
          <span className="opacity-70 min-w-[90px]">Created</span>
          <span className="opacity-90">{formatDate(createdAt)}</span>
        </div>

        {/* Description */}
        <div className="flex items-start gap-3 text-sm">
          <span className="opacity-70 min-w-[90px]">Description</span>
          <div className="flex-1">
            <textarea
              value={localDesc}
              onChange={(e) => {
                setLocalDesc(e.target.value);
                onDescriptionChange?.(e.target.value);
              }}
              placeholder="Write a short summary…"
              className="w-full min-h-[60px] rounded-md border bg-transparent p-2 text-sm outline-none"
            />
          </div>
        </div>

        {/* Custom Properties */}
        <div className="space-y-2 pt-2">
          {properties.map((row) => (
            <PropertyRow
              key={row.definition.id}
              row={row}
              onChange={(next) => {
                const updated = properties.map((p) =>
                  p.definition.id === next.definition.id ? next : p
                );
                onPropertiesChange?.(updated);
              }}
              onDelete={(definitionId) => {
                const updated = properties.filter(
                  (p) => p.definition.id !== definitionId
                );
                onPropertiesChange?.(updated);
              }}
              onSaveOptions={handleSaveOptions}
            />
          ))}

          {/* Add Property trigger */}
          <div className="flex items-center gap-3 text-sm">
            <span className="opacity-70 min-w-[90px]"> </span>
            <AddPropertyDialog docId={docId} onCreate={handleCreateProperty} />
          </div>
        </div>
      </div>

      <hr className="border-t" />
    </div>
  );
}
