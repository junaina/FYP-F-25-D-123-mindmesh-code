// src/components/wiki/DocHeader.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AddPropertyDialog from "./AddPropertyDialog";
import PropertyRow from "./PropertyRow";
import type {
  UIDocPropertyRow,
  UIPropertyDefinition,
  PropertyValue,
} from "@/types/wiki";
import OptionEditorDialog from "@/components/wiki/ui/OptionEditorDialog";
import { chipClasses, type ChipColor } from "@/components/wiki/ui/chip-colors";

/** Public props for the header */
export type DocHeaderProps = {
  title: string;
  createdAt: string | Date;
  tags?: string[];
  description?: string;

  onTitleChange?: (title: string) => void;
  onTagsChange?: (tags: string[]) => void;
  onDescriptionChange?: (description: string) => void;
  onPropertiesChange?: (rows: UIDocPropertyRow[]) => void;
  tagSuggestions?: string[];
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

/** Default value factory for a new property row (note typed arrays) */
function defaultValue(def: UIPropertyDefinition): PropertyValue {
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
  title,
  createdAt,
  tags = [],
  description = "",
  onTitleChange,
  onTagsChange,
  onDescriptionChange,
  onPropertiesChange,
  tagSuggestions = [
    "Preliminary",
    "Documentation",
    "Informal",
    "Draft",
    "Important",
  ],
}: DocHeaderProps) {
  // ----- title / tags / description state -----
  const [localTitle, setLocalTitle] = useState(title || "Untitled");
  const [localTags, setLocalTags] = useState<string[]>(tags);
  const [localDesc, setLocalDesc] = useState(description);
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");

  // per-tag color map (theme-aware via CSS vars); persist later if you want
  const [tagColors, setTagColors] = useState<Record<string, ChipColor>>({});

  // tag edit dialog state
  const [editingTag, setEditingTag] = useState<{
    original: string;
    name: string;
    color: ChipColor | undefined;
  } | null>(null);

  const titleRef = useRef<HTMLDivElement>(null);

  // Push changes up (parent can autosave)
  useEffect(() => onTitleChange?.(localTitle), [localTitle, onTitleChange]);
  useEffect(() => onTagsChange?.(localTags), [localTags, onTagsChange]);
  useEffect(
    () => onDescriptionChange?.(localDesc),
    [localDesc, onDescriptionChange]
  );

  const sortedSuggestions = useMemo(
    () => tagSuggestions.filter((t) => !localTags.includes(t)),
    [tagSuggestions, localTags]
  );

  function handleTitleInput(e: React.FormEvent<HTMLDivElement>) {
    const text = (e.currentTarget.textContent ?? "").trim();
    setLocalTitle(text.length ? text : "Untitled");
  }

  function addTag(tag: string) {
    if (!tag) return;
    if (localTags.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    setLocalTags((prev) => [...prev, tag]);
    setNewTag("");
    setAddingTag(false);
  }

  function removeTag(tag: string) {
    setLocalTags((prev) => prev.filter((t) => t !== tag));
    setTagColors((prev) => {
      const next = { ...prev };
      delete next[tag];
      return next;
    });
  }

  // ----- custom properties state -----
  const [properties, setProperties] = useState<UIDocPropertyRow[]>([]);

  // emit to parent when properties change
  useEffect(() => {
    onPropertiesChange?.(properties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  function handleCreateProperty(def: UIPropertyDefinition) {
    setProperties((prev) => [
      ...prev,
      { definition: def, value: defaultValue(def) },
    ]);
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

        {/* Tags */}
        <div className="flex items-start gap-3 text-sm">
          <span className="opacity-70 min-w-[90px]">Tags</span>
          <div className="flex flex-wrap items-center gap-2">
            {localTags.map((tag, i) => {
              const color = tagColors[tag];
              return (
                <span
                  key={`${tag}-${i}`}
                  className={chipClasses(
                    color,
                    true,
                    "mm-chip-lg select-none cursor-grab active:cursor-grabbing"
                  )}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", String(i));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = Number(e.dataTransfer.getData("text/plain"));
                    if (Number.isNaN(from) || from === i) return;
                    const copy = [...localTags];
                    const [m] = copy.splice(from, 1);
                    copy.splice(i, 0, m);
                    setLocalTags(copy);
                  }}
                  title={tag}
                  // click anywhere on the chip (except ×) to edit
                  onClick={() =>
                    setEditingTag({
                      original: tag,
                      name: tag,
                      color: color ?? "gray",
                    })
                  }
                >
                  <span className="opacity-60 mr-1">⋮⋮</span>
                  <span className="truncate max-w-[12rem]">{tag}</span>
                  <button
                    type="button"
                    className="ml-1 rounded px-1 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation(); // don't open editor
                      removeTag(tag);
                    }}
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}

            {!addingTag ? (
              <button
                type="button"
                className="mm-chip mm-chip-lg mm-chip--gray hover:opacity-100 opacity-80"
                onClick={() => setAddingTag(true)}
              >
                + Tag
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  autoFocus
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTag(newTag.trim());
                    if (e.key === "Escape") setAddingTag(false);
                  }}
                  placeholder="Add tag…"
                  className="h-9 rounded-md border bg-transparent px-2 text-sm outline-none"
                />
                {sortedSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {sortedSuggestions.slice(0, 4).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="mm-chip mm-chip-lg mm-chip--gray"
                        onClick={() => addTag(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="flex items-start gap-3 text-sm">
          <span className="opacity-70 min-w-[90px]">Description</span>
          <div className="flex-1">
            <textarea
              value={localDesc}
              onChange={(e) => setLocalDesc(e.target.value)}
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
              onChange={(next) =>
                setProperties((prev) =>
                  prev.map((p) =>
                    p.definition.id === next.definition.id ? next : p
                  )
                )
              }
              onDelete={(definitionId) =>
                setProperties((prev) =>
                  prev.filter((p) => p.definition.id !== definitionId)
                )
              }
            />
          ))}

          {/* Add Property trigger */}
          <div className="flex items-center gap-3 text-sm">
            <span className="opacity-70 min-w-[90px]"> </span>
            <AddPropertyDialog onCreate={handleCreateProperty} />
          </div>
        </div>
      </div>

      <hr className="border-t" />

      {/* Tag editor dialog */}
      {editingTag && (
        <OptionEditorDialog
          key={editingTag.original} // ← ensures fresh initial state per tag
          open={!!editingTag}
          initialLabel={editingTag.name}
          initialColor={editingTag.color}
          onClose={() => setEditingTag(null)}
          onSave={(patch) => {
            setLocalTags((prev) =>
              prev.map((t) => (t === editingTag.original ? patch.value : t))
            );
            setTagColors((prev) => {
              const next = { ...prev };
              delete next[editingTag.original];
              if (patch.color) next[patch.value] = patch.color;
              return next;
            });
            setEditingTag(null);
          }}
        />
      )}
    </div>
  );
}
