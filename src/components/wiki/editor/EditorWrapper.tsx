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
import { TimelineViewExtension } from "@/components/wiki/extensions/kov/TimelineView/TimelineViewExtension";
import { CalendarViewExtension } from "../extensions/kov/CalendarView/CalendarViewExtension";
import { SlashIcons } from "@/components/wiki/extensions/slashIcons";
import { GoogleDriveEmbed } from "@/components/wiki/extensions/GoogleDriveEmbed";
import { createGoogleDriveEmbed } from "@/modules/documents/client/embeds.api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
type Props = { projectId: string; docId: string };

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
// helper
const monthStartIsoUtc = (d = new Date()) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
function deriveDriveLinks(rawUrl: string) {
  try {
    const u = new URL(rawUrl);
    if (
      u.hostname.includes("drive.google.com") &&
      u.pathname.includes("/file/d/")
    ) {
      const parts = u.pathname.split("/");
      const dIndex = parts.indexOf("d");
      const fileId = dIndex >= 0 ? parts[dIndex + 1] : null;

      if (fileId) {
        return {
          previewLink: `https://drive.google.com/file/d/${fileId}/preview`,
          webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
        };
      }
    }
  } catch {
    // ignore and fall back
  }
  return { previewLink: rawUrl, webViewLink: rawUrl };
}
export default function EditorWrapper({ projectId, docId }: Props) {
  const idsReady = Boolean(projectId && docId);
  const [initial, setInitial] = useState<JSONContent | undefined>();
  const [serverUpdatedAt, setServerUpdatedAt] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  type DrivePromptState = {
    from: number;
    to: number;
    top: number;
    left: number;
  };
  const [drivePrompt, setDrivePrompt] = useState<DrivePromptState | null>(null);

  const openDrivePrompt = (editor: any) => {
    const wrap = wrapperRef.current;
    if (!wrap || !editor || editor.isDestroyed) return;

    const { state, view } = editor;
    if (!view) return;

    const { from, to } = state.selection;
    const caretRect = view.coordsAtPos(from);
    const wrapperRect = wrap.getBoundingClientRect();

    setDrivePrompt({
      from,
      to,
      top: caretRect.bottom - wrapperRect.top + 8, // 8px below caret
      left: caretRect.left - wrapperRect.left, // aligned with caret x
    });
  };

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

  // put this near your existing slash items (e.g., after timelineSlashItem)
  const calendarSlashItem = useMemo(
    () => ({
      title: "Calendar",
      description: "Insert a calendar view",
      icon: SlashIcons.calendar,
      command: async ({ editor }: { editor: any }) => {
        try {
          // 1) Create calendar collection (network)
          const res = await fetch(
            `/api/projects/${projectId}/docs/${docId}/collections/calendar`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: "Calendar" }),
            }
          );
          if (!res.ok) {
            console.error(
              "[/calendar] create failed",
              res.status,
              await res.text().catch(() => "")
            );
            return;
          }
          const { id: collectionId } = await res.json();

          // 2) Defer the ProseMirror insert to the next frame
          const start = new Date(
            Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
          ).toISOString();

          requestAnimationFrame(() => {
            if (!editor || editor.isDestroyed) return;

            const pos = editor.state.selection.from; // fresh state
            const inserted =
              typeof editor.commands.insertCalendarView === "function"
                ? editor
                    .chain()
                    .focus()
                    .insertCalendarView({ collectionId, view: "month", start })
                    .run()
                : editor
                    .chain()
                    .focus()
                    .insertContentAt({ from: pos, to: pos }, [
                      {
                        type: "calendarView",
                        attrs: { collectionId, view: "month", start },
                      },
                      { type: "paragraph" },
                    ])
                    .run();

            if (!inserted) return;

            // 3) Persist immediately (optional; autosave will also run)
            patchDocContent(projectId, docId, {
              content: editor.getJSON(),
            }).catch((e: any) => {
              console.warn("[/calendar] patch after insert failed", e);
            });
          });
        } catch (e) {
          console.error("[/calendar] unexpected error", e);
        }
      },
    }),
    [projectId, docId]
  );
  const googleDriveSlashItem = useMemo(
    () => ({
      title: "Google Drive PDF",
      description: "Embed a PDF from Google Drive",
      icon: SlashIcons.googleDrive,
      command: ({ editor }: { editor: any }) => {
        // just open the inline form at the cursor
        openDrivePrompt(editor);
      },
    }),
    [projectId, docId] // openDrivePrompt is stable in this component
  );

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
  // Memoize the “Timeline” slash item so it captures projectId/docId
  const timelineSlashItem = useMemo(
    () => ({
      title: "Timeline",
      description: "Insert a timeline for this doc",
      icon: SlashIcons.timeline, // or add a dedicated .timeline icon in slashIcons.ts
      command: async ({ editor }: { editor: any }) => {
        const url = `/api/projects/${projectId}/docs/${docId}/collections/timeline`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Untitled Timeline" }),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("[slash:timeline] create failed", res.status, txt);
          return;
        }
        const { id: collectionId } = await res.json();

        // Prefer the command (inserts node + paragraph). Fallback to raw insert.
        const hasCmd = typeof editor.commands.insertTimelineView === "function";
        const defaultView = "month";
        const defaultStart = new Date().toISOString();

        const ok = hasCmd
          ? editor
              .chain()
              .focus()
              .insertTimelineView({
                collectionId,
                view: defaultView,
                start: defaultStart,
              })
              .run()
          : editor
              .chain()
              .focus()
              .insertContent([
                {
                  type: "timelineView",
                  attrs: {
                    collectionId,
                    view: defaultView,
                    start: defaultStart,
                  },
                },
                { type: "paragraph" },
              ])
              .run();

        console.log("[slash:timeline] inserted =", ok);
        console.log("[slash:timeline] doc after insert =", editor.getJSON());
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
      TimelineViewExtension({ projectId, docId }),
      CalendarViewExtension({ projectId, docId }),
      GoogleDriveEmbed,
      SlashMenuExtension({
        extraItems: [
          tableSlashItem,
          timelineSlashItem,
          calendarSlashItem,
          googleDriveSlashItem,
        ],
      }),
    ],
    [
      projectId,
      docId,
      tableSlashItem,
      timelineSlashItem,
      calendarSlashItem,
      googleDriveSlashItem,
    ]
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

  // ...

  if (!editor) return null;
  return (
    <div
      ref={wrapperRef}
      data-project-id={projectId}
      data-doc-id={docId}
      className="h-full relative"
    >
      <EditorContent editor={editor} />

      {drivePrompt && (
        <DriveEmbedInlineForm
          top={drivePrompt.top}
          left={drivePrompt.left}
          onClose={() => setDrivePrompt(null)}
          onSubmit={async (url, name) => {
            if (!url || !drivePrompt) return;

            // Use the latest editor from useEditor()
            if (!editor || editor.isDestroyed || !editor.view) {
              setDrivePrompt(null);
              return;
            }

            const embed = await createGoogleDriveEmbed({
              projectId,
              docId,
              url,
              name: name || undefined,
            });

            const { previewLink, webViewLink } = deriveDriveLinks(url);
            const displayName = name || "Google Drive file";

            const { from, to } = drivePrompt;

            editor
              .chain()
              .focus()
              .insertContentAt({ from, to }, [
                {
                  type: "googleDriveEmbed",
                  attrs: {
                    embedId: embed.id,
                    name: displayName,
                    previewLink,
                    webViewLink,
                  },
                },
                { type: "paragraph" },
              ])
              .run();

            await patchDocContent(projectId, docId, {
              content: editor.getJSON(),
            });

            setDrivePrompt(null);
          }}
        />
      )}
    </div>
  );
}

type DriveEmbedInlineFormProps = {
  top: number;
  left: number;
  onClose: () => void;
  onSubmit: (url: string, name: string) => void | Promise<void>;
};

function DriveEmbedInlineForm({
  top,
  left,
  onClose,
  onSubmit,
}: DriveEmbedInlineFormProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleKeyDown: React.KeyboardEventHandler<HTMLFormElement> = async (
    e
  ) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (!submitting) onClose();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (submitting) return;
      await doSubmit();
    }
  };

  const doSubmit = async () => {
    const trimmedUrl = url.trim();
    const trimmedName = name.trim();
    if (!trimmedUrl) return;

    try {
      setSubmitting(true);
      await onSubmit(trimmedUrl, trimmedName);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    if (submitting) return;
    await doSubmit();
  };

  return (
    <div className="absolute z-50" style={{ top, left }}>
      <Card className="p-3 shadow-lg border bg-popover">
        <form
          className="space-y-2 min-w-[260px]"
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
        >
          <div className="space-y-1">
            <Label htmlFor="gdrive-url">Google Drive URL</Label>
            <Input
              id="gdrive-url"
              autoFocus
              placeholder="https://drive.google.com/file/d/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="gdrive-name">Display name (optional)</Label>
            <Input
              id="gdrive-name"
              placeholder="Security Slides, Sprint Plan..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !url.trim()}
            >
              {submitting ? "Embedding..." : "Embed"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
