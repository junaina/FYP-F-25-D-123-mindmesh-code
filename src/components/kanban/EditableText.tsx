"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  kind?: "input" | "textarea";
  maxLength?: number;
};

/**
 * Click-to-edit text that turns into a bordered input/textarea.
 * Saves on Enter (and prevents newline) or on blur. Escape cancels.
 */
export function EditableText({
  value,
  onChange,
  placeholder,
  className,
  kind = "input",
  maxLength,
}: Props) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => setDraft(value), [value]);

  const commit = () => {
    const trimmed = draft?.trim() || (placeholder ?? "");
    onChange(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        className={cn(
          "text-left w-full rounded-md px-2 py-1 hover:bg-neutral-800/60 focus:bg-neutral-800/60 focus:outline-none",
          className
        )}
        onClick={() => setEditing(true)}
        title="Click to edit"
      >
        {value?.length ? (
          value
        ) : (
          <span className="text-neutral-400">
            {placeholder ?? "Click to edit"}
          </span>
        )}
      </button>
    );
  }

  const commonProps = {
    autoFocus: true,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && kind === "input") {
        e.preventDefault();
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === "Enter" && kind === "textarea") {
        // Save on Enter for textarea as requested
        e.preventDefault();
        (e.target as HTMLTextAreaElement).blur();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    },
    maxLength,
    className: cn(
      "w-full bg-neutral-900 border border-neutral-700 focus-visible:ring-0 focus:border-neutral-500 text-white",
      className
    ),
  };

  return kind === "textarea" ? (
    <Textarea rows={3} {...commonProps} />
  ) : (
    <Input {...commonProps} />
  );
}
