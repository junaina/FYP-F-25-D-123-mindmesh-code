"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  /** Committed value. */
  value: string;
  /** Called on commit (blur / Enter), not on each keystroke. */
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  kind?: "input" | "textarea";
  maxLength?: number;
};

export function EditableText({
  value,
  onChange,
  placeholder,
  className,
  kind = "input",
  maxLength,
}: Props) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? "");

  // Separate refs so we can type them precisely
  const inputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const start = () => {
    setDraft(value ?? "");
    setEditing(true);
  };

  const commit = () => {
    if ((draft ?? "") !== (value ?? "")) onChange(draft ?? "");
    setEditing(false);
  };

  React.useEffect(() => {
    if (!editing) return;
    if (kind === "textarea") {
      textareaRef.current?.focus();
    } else {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.select();
      }
    }
  }, [editing, kind]);

  if (editing) {
    const common =
      "w-full rounded-md bg-transparent text-foreground placeholder:text-muted-foreground " +
      "border border-neutral-300 dark:border-neutral-700 " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 " +
      "focus-visible:border-neutral-400 dark:focus-visible:border-neutral-600";

    if (kind === "textarea") {
      return (
        <Textarea
          ref={textareaRef}
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setDraft(e.target.value)
          }
          onBlur={commit}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Escape") setEditing(false);
          }}
          onPointerDownCapture={(e) => e.stopPropagation()}
          onMouseDownCapture={(e) => e.stopPropagation()}
          className={cn(common, "min-h-[38px] resize-none", className)}
          spellCheck={false}
        />
      );
    }

    // input
    return (
      <Input
        ref={inputRef}
        value={draft}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setDraft(e.target.value)
        }
        onBlur={commit}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Escape") setEditing(false);
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onMouseDownCapture={(e) => e.stopPropagation()}
        className={cn(common, className)}
        spellCheck={false}
      />
    );
  }

  // VIEW MODE — transparent; subtle ring on hover/focus
  return (
    <button
      type="button"
      onClick={start}
      className={cn(
        "text-left w-full rounded-md px-1.5 py-1 transition",
        "bg-transparent ring-1 ring-transparent",
        "hover:ring-neutral-300/70 dark:hover:ring-neutral-700/70",
        "focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:outline-none",
        className
      )}
    >
      {value?.trim() ? (
        value
      ) : (
        <span className="text-muted-foreground">
          {placeholder ?? "Untitled"}
        </span>
      )}
    </button>
  );
}
