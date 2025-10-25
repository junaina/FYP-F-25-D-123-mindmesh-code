"use client";

import { useEffect, useRef } from "react";
import { Editor } from "@tiptap/core";
import { patchDocContent } from "./docs.api";
import type { EditorEvents } from "@tiptap/core";
type Args = {
  editor: Editor | null;
  projectId: string;
  docId: string;
  getLastServerUpdatedAt: () => string | null;
  setLastServerUpdatedAt: (iso: string) => void;
  onConflict?: () => Promise<void>; 
  debounceMs?: number;
};

export function useAutosave({
  editor,
  projectId,
  docId,
  getLastServerUpdatedAt,
  setLastServerUpdatedAt,
  onConflict,
  debounceMs = 800,
}: Args) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef<string>("");

  useEffect(() => {
    if (!editor) return;

    const onUpdate: (e: EditorEvents["update"]) => void = ({ transaction }) => {
      if (!transaction.docChanged) return;

      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(async () => {
        try {
          const json = editor.getJSON();
          const payload = JSON.stringify(json);
          if (payload === lastSent.current) return;

          const lastKnown = getLastServerUpdatedAt();
          const res = await patchDocContent(projectId, docId, {
            content: json,
            lastKnownUpdatedAt: lastKnown ?? undefined,
          });

          lastSent.current = payload;
          setLastServerUpdatedAt(res.updatedAt);
        } catch (e: any) {
          if (e?.status === 409 && onConflict) {
            await onConflict();
          } else {
            console.error(e);
          }
        }
      }, debounceMs);
    };

    editor.on("update", onUpdate);

    return () => {
      if (t.current) clearTimeout(t.current);
      editor.off("update", onUpdate); 
    };
  }, [
    editor,
    projectId,
    docId,
    debounceMs,
    getLastServerUpdatedAt,
    setLastServerUpdatedAt,
    onConflict,
  ]);
}
