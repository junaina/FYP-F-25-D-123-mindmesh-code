"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { patchDocHeader } from "@/modules/documents/client/docs.api";
type Props = {
  projectId: string;
  docId: string;
  title?: string;
};
export default function HeaderTitle({ projectId, docId, title }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(title ?? "Untitled");
  const [editing, setEditing] = useState(false);

  async function save(newTitle: string) {
    const safeTitle = newTitle.trim().length > 0 ? newTitle.trim() : "Untitled";
    setValue(safeTitle);

    try {
      await patchDocHeader(projectId, docId, { title: safeTitle });
      router.refresh();
    } catch (e) {
      console.error("Failed to save title:", e);
    }
  }

  return (
    <header className="flex items-center justify-between gap-3">
      {editing ? (
        <input
          className="text-2xl font-semibold bg-transparent border-none focus:outline-none"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            setEditing(false);
            void save(value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          autoFocus
        />
      ) : (
        <h1
          className="text-2xl font-semibold truncate cursor-text"
          onClick={() => setEditing(true)}
        >
          {value}
        </h1>
      )}
    </header>
  );
}
