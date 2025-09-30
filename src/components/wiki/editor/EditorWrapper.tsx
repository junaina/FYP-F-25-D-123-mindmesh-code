"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type UseEditorOptions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import type { EditorEvents } from "@tiptap/core";
import {
  fetchDocContent,
  patchDocContent,
} from "@/modules/documents/client/docs.api";

type Props = { projectId: string; docId: string };

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export default function EditorWrapper({ projectId, docId }: Props) {
  // do not start anything if ids are missing
  const idsReady = Boolean(projectId && docId);
  const [initial, setInitial] = useState<JSONContent | undefined>();
  const [serverUpdatedAt, setServerUpdatedAt] = useState<string | null>(null);

  // Load initial content
  useEffect(() => {
    if (!idsReady) return;
    let alive = true;
    (async () => {
      const d = await fetchDocContent(projectId, docId);
      if (!alive) return;
      setInitial(d.content);
      setServerUpdatedAt(d.updatedAt);
    })().catch(console.error);
    return () => {
      alive = false;
    };
  }, [idsReady, projectId, docId]);

  const editorOptions: UseEditorOptions & { immediatelyRender: false } = {
    extensions: [
      StarterKit,
      TaskList,
      TaskItem,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "Type / for commands…" }),
    ],
    content: EMPTY_DOC,
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none focus:outline-none min-h-[40vh]",
      },
    },
    immediatelyRender: false, // <-- fixes SSR hydration mismatch
  };
  // Always pass an options object to useEditor
  const editor = useEditor(editorOptions, [projectId, docId]);
  // Replace temp content with real content when it arrives
  const suppressSave = useRef(false);
  useEffect(() => {
    if (!editor || !initial) return;
    suppressSave.current = true;
    editor.commands.setContent(initial); // no boolean second arg
    suppressSave.current = false;
  }, [editor, initial]);

  // Autosave (debounced) + OCC
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef<string>("");

  useEffect(() => {
    if (!editor) return;

    const onUpdate: (e: EditorEvents["update"]) => void = ({ transaction }) => {
      if (suppressSave.current) return;
      if (!transaction.docChanged) return;

      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(async () => {
        try {
          const json = editor.getJSON();
          const payload = JSON.stringify(json);
          if (payload === lastSent.current) return;

          const res = await patchDocContent(projectId, docId, {
            content: json,
            lastKnownUpdatedAt: serverUpdatedAt ?? undefined,
          });

          lastSent.current = payload;
          setServerUpdatedAt(res.updatedAt);
        } catch (err) {
          // handle conflict/other errors → refetch + replace
          const d = await fetchDocContent(projectId, docId);
          suppressSave.current = true;
          editor.commands.setContent(d.content);
          suppressSave.current = false;
          setServerUpdatedAt(d.updatedAt);
          lastSent.current = JSON.stringify(d.content);
        }
      }, 900);
    };

    editor.on("update", onUpdate);
    return () => {
      if (t.current) clearTimeout(t.current);
      editor.off("update", onUpdate);
      lastSent.current = "";
    };
  }, [editor, projectId, docId, serverUpdatedAt]);

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}
