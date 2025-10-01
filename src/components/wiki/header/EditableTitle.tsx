"use client";

import * as React from "react";
import { patchDocHeader } from "@/modules/documents/client/docs.api";
import { Loader2 } from "lucide-react";

type Props = {
  projectId: string;
  docId: string;
  initialTitle: string;
  className?: string;
  onSaved?: (newTitle: string) => void; // optional: parent can refresh
};

export default function EditableTitle({
  projectId,
  docId,
  initialTitle,
  className,
  onSaved,
}: Props) {
  const [value, setValue] = React.useState<string>(initialTitle);
  const [prev, setPrev] = React.useState<string>(initialTitle);
  const [editing, setEditing] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // keep in sync if parent title changes
  React.useEffect(() => {
    setValue(initialTitle);
    setPrev(initialTitle);
  }, [initialTitle]);

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit(next: string) {
    const trimmed = next.trim();
    setError(null);

    // If unchanged, just exit
    if (trimmed === prev) {
      setEditing(false);
      return;
    }
    if (trimmed.length === 0) {
      setError("Title cannot be empty");
      return;
    }

    // optimistic UI
    setValue(trimmed);
    setSaving(true);
    try {
      await patchDocHeader(projectId, docId, { title: trimmed });
      setPrev(trimmed);
      setEditing(false);
      onSaved?.(trimmed);
    } catch (e) {
      // rollback
      setValue(prev);
      setError((e as Error).message || "Failed to save title");
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void commit(value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setValue(prev);
      setEditing(false);
      setError(null);
    }
  }

  if (!editing) {
    return (
      <h1
        className={`cursor-text text-xl font-semibold truncate ${
          className ?? ""
        }`}
        onClick={() => setEditing(true)}
        title="Click to edit title"
      >
        {value || "Untitled"}
      </h1>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => void commit(value)}
        className={`w-full bg-transparent outline-none border-b border-transparent focus:border-border text-2xl font-semibold p-0 ${
          className ?? ""
        }`}
        aria-label="Document title"
        disabled={saving}
      />
      {saving && (
        <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" />
      )}
      {error && (
        <span className="text-xs text-red-500" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
