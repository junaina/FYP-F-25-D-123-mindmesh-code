"use client";

import { Node, mergeAttributes, CommandProps } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import TimelineViewNode from "./TimelineViewNode";
import { createTimeline } from "@/modules/timeline/client/timeline.api";
import { patchDocContent } from "@/modules/documents/client/docs.api";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    timelineView: {
      insertTimelineView: (opts?: {
        collectionId?: string;
        view?: "month" | "week" | "day" | "hour";
        start?: string; // ISO
      }) => ReturnType;
    };
  }
}

export function TimelineViewExtension(opts: {
  projectId: string;
  docId: string;
}) {
  return Node.create({
    name: "timelineView",
    group: "block",
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
      return {
        collectionId: { default: null },
        view: { default: "month" },
        start: {
          // ISO anchor; component expects a string
          default: () => new Date().toISOString(),
        },
      };
    },

    parseHTML() {
      return [{ tag: "timeline-view" }];
    },

    renderHTML({ HTMLAttributes }) {
      return ["timeline-view", mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
      // keep NodeView dumb: all guarantees (collectionId/view/start) are set on insert
      console.log("[timelineView] addNodeView called");
      return ReactNodeViewRenderer((p: any) => (
        <TimelineViewNode
          {...p}
          projectId={opts.projectId}
          docId={opts.docId}
        />
      ));
    },

    addCommands() {
      return {
        insertTimelineView:
          (userOpts) =>
          ({ editor }) => {
            const { projectId, docId } = opts;

            const view = userOpts?.view ?? "month";
            const start = userOpts?.start ?? new Date().toISOString();

            const doInsert = (collectionId: string) => {
              editor
                .chain()
                .focus()
                .insertContent([
                  { type: this.name, attrs: { collectionId, view, start } },
                  { type: "paragraph" },
                ])
                .run();

              // persist content (fire & forget)
              void patchDocContent(projectId, docId, {
                content: editor.getJSON(),
              });
            };

            // If caller provided a collectionId, insert immediately.
            if (userOpts?.collectionId) {
              doInsert(userOpts.collectionId);
            } else {
              // Create collection asynchronously, then insert when ready.
              createTimeline({ projectId, docId })
                .then((created) => doInsert(created.id))
                .catch((e) => console.warn("[timeline] create failed", e));
            }

            // Must return synchronously for TipTap typing
            return true;
          },
      };
    },
  });
}
