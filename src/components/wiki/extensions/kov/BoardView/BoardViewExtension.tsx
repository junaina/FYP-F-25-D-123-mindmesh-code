"use client";

import { Node, mergeAttributes, CommandProps } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import BoardViewNode from "./BoardViewNode";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    boardView: {
      /**
       * Insert a board view node.
       * NOTE: collectionId is required (slash command will create it).
       */
      insertBoardView: (opts: { collectionId: string }) => ReturnType;
    };
  }
}

export function BoardViewExtension(opts: { projectId: string; docId: string }) {
  return Node.create({
    name: "boardView",
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
      };
    },

    // minimal HTML round-trip (copy/paste/export)
    parseHTML() {
      return [{ tag: "board-view" }];
    },

    renderHTML({ HTMLAttributes }) {
      return ["board-view", mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
      return ReactNodeViewRenderer((props: any) => (
        <BoardViewNode
          projectId={opts.projectId}
          docId={opts.docId}
          collectionId={props.node.attrs.collectionId}
        />
      ));
    },

    addCommands() {
      return {
        insertBoardView:
          ({ collectionId }: { collectionId: string }) =>
          ({ chain }: CommandProps) => {
            if (!collectionId) return false;

            return chain()
              .focus()
              .insertContent([
                { type: this.name, attrs: { collectionId } },
                { type: "paragraph" },
              ])
              .run();
          },
      };
    },
  });
}
