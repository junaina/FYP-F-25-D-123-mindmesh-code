"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type UseEditorOptions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import { CustomTaskItem } from "@/components/wiki/extensions/CustomTaskItem";
import {
  Toggle,
  ToggleSummary,
  ToggleBody,
} from "@/components/wiki/extensions/ToggleExtension";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent, Content, EditorEvents } from "@tiptap/core";

import {
  fetchDocContent,
  patchDocContent,
} from "@/modules/documents/client/docs.api";

import { SlashMenuExtension } from "@/components/wiki/extensions/SlashMenuExtension";

import { TableViewExtension } from "@/components/wiki/extensions/kov/TableView/TableViewExtension";
import { SlashIcons } from "@/components/wiki/extensions/slashIcons";

type Props = { projectId: string; docId: string };

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export default function EditorWrapper({ projectId, docId }: Props) {
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
    return () => void (alive = false);
  }, [idsReady, projectId, docId]);

  // Memoize the “Table” slash item so it captures projectId/docId
  const tableSlashItem = useMemo(
    () => ({
      title: "Table",
      description: "Insert a database-like table",
      icon: SlashIcons.table,
      command: async ({ editor }: { editor: any }) => {
        const url = `/api/projects/${projectId}/docs/${docId}/collections/table`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Untitled Table" }),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("[slash:table] create failed", res.status, txt);
          return;
        }
        const { id: collectionId } = await res.json();

        // Prefer the built-in command (now robust), otherwise force a raw insert of a block slice.

        const hasCmd = typeof editor.commands.insertTableView === "function";
        const ok = hasCmd
          ? editor.chain().focus().insertTableView({ collectionId }).run()
          : editor
              .chain()
              .focus()
              .insertContent([
                { type: "tableView", attrs: { collectionId } },
                { type: "paragraph" },
              ])
              .run();

        console.log("[slash:table] inserted =", ok);
        console.log("[slash:table] doc after insert =", editor.getJSON());
      },
    }),
    [projectId, docId]
  );

  // Memoize the extensions array
  const extensions = useMemo(
    () => [
      StarterKit,
      TaskList,
      CustomTaskItem,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "Type / for commands…" }),
      Toggle,
      ToggleSummary,
      ToggleBody,
      TableViewExtension({ projectId, docId }),
      SlashMenuExtension({ extraItems: [tableSlashItem] }), // call the factory
    ],
    [projectId, docId, tableSlashItem]
  );

  // Build the editor options (optionally memoize this object too)
  const editorOptions: UseEditorOptions & { immediatelyRender: false } = {
    extensions,
    content: EMPTY_DOC,
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none focus:outline-none min-h-[40vh] mm-editor",
      },
    },
    immediatelyRender: false,
  };

  // ✅ The dependency array goes HERE (2nd arg). Using `extensions` keeps it precise.
  const editor = useEditor(editorOptions, [extensions]);

  // Replace temp content with real content when it arrives
  const suppressSave = useRef(false);
  const lastSent = useRef<string>("");
  const appliedInitial = useRef(false);
  useEffect(() => {
    if (!editor || !initial) return;
    appliedInitial.current = true;
    const contentToLoad: Content = initial;

    suppressSave.current = true;
    queueMicrotask(() => {
      if (!editor) return;
      (editor as any).setContent?.(contentToLoad, false) ??
        editor.commands.setContent(contentToLoad);
      lastSent.current = JSON.stringify(contentToLoad);
      suppressSave.current = false;
    });
  }, [editor, initial]);

  // Autosave (debounced) + OCC
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!editor) return;
    const extNames = editor.extensionManager.extensions.map((e: any) => e.name);
    console.log("[editor] extensions:", extNames);
    console.log(
      "[editor] has insertTableView:",
      typeof editor.commands.insertTableView
    );
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
        } catch {
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
