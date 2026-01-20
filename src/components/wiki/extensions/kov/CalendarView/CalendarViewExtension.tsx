"use client";

import { Node, mergeAttributes, CommandProps } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CalendarViewNode from "./CalendarViewNode";

/** UTC month-start in ISO (yyyy-mm-01T00:00:00.000Z) */
function monthStartIsoUtc(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return d.toISOString();
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    calendarView: {
      /**
       * Insert a calendar view node.
       * NOTE: collectionId is required (the slash command will create it, then call this).
       */
      insertCalendarView: (opts: {
        collectionId: string;
        view?: "month";
        start?: string; // ISO yyyy-mm-01T00:00:00.000Z
      }) => ReturnType;
    };
  }
}

export function CalendarViewExtension(opts: {
  projectId: string;
  docId: string;
}) {
  return Node.create({
    name: "calendarView",
    group: "block",
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
      return {
        collectionId: {
          default: null,
          renderHTML: (attrs: any) => ({
            "data-collection-id": attrs.collectionId,
          }),
          parseHTML: (el: HTMLElement) => el.getAttribute("data-collection-id"),
        },
        view: {
          default: "month",
          renderHTML: (attrs: any) => ({ "data-view": attrs.view }),
          parseHTML: (el: HTMLElement) =>
            el.getAttribute("data-view") ?? "month",
        },
        start: {
          default: monthStartIsoUtc(),
          renderHTML: (attrs: any) => ({ "data-start": attrs.start }),
          parseHTML: (el: HTMLElement) =>
            el.getAttribute("data-start") ?? monthStartIsoUtc(),
        },
      };
    },

    /** Minimal HTML round-trip for copy/paste/export */
    parseHTML() {
      return [{ tag: "calendar-view" }];
    },

    renderHTML({ HTMLAttributes }) {
      return ["calendar-view", mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
      // Mount the React NodeView we built in Phase 3
      return ReactNodeViewRenderer((props: any) => (
        <CalendarViewNode
          projectId={opts.projectId}
          docId={opts.docId}
          {...props}
        />
      ));
    },

    addCommands() {
      return {
        insertCalendarView:
          (user) =>
          ({ editor }: CommandProps) => {
            const collectionId = user?.collectionId;
            if (!collectionId) {
              // We require the slash-command to create the collection first.
              // Returning false lets callers decide how to handle it.
              return false;
            }
            const view = user?.view ?? "month";
            const start = user?.start ?? monthStartIsoUtc();

            return editor
              .chain()
              .focus()
              .insertContent([
                { type: this.name, attrs: { collectionId, view, start } },
                { type: "paragraph" },
              ])
              .run();
          },
      };
    },
  });
}
