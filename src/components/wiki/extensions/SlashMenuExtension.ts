// src/components/wiki/extensions/SlashMenuExtension.ts
import { Extension, type Editor } from "@tiptap/core";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";
import type { Plugin } from "prosemirror-state";
import styles from "./SlashTasks.module.css";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
  type MiddlewareState,
} from "@floating-ui/dom";
export type SlashItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  command: (ctx: { editor: Editor }) => void;
};
import React from "react";
import { createRoot, type Root } from "react-dom/client";

import { SlashIcons } from "./slashIcons";
import { LucideIcon } from "lucide-react";

const SLASH_ITEMS: SlashItem[] = [
  {
    title: "Heading 1",
    description: "Big section heading",
    icon: SlashIcons.heading1,
    command: ({ editor }) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: SlashIcons.heading2,
    command: ({ editor }) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: SlashIcons.heading3,
    command: ({ editor }) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Bulleted list",
    description: "Create a bulleted list",
    icon: SlashIcons.bulletedList,
    command: ({ editor }) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered list",
    description: "Create a numbered list",
    icon: SlashIcons.numberedList,
    command: ({ editor }) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "To-do list",
    description: "Track tasks",
    icon: SlashIcons.todoList,
    command: ({ editor }) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: "Toggle list",
    description: "Collapsible section",
    icon: SlashIcons.toggleList,
    command: ({ editor }) =>
      editor.chain().focus().toggleList("toggleList", "toggleItem").run(),
  },
  {
    title: "Google Drive",
    description: "Embed a doc from Google Drive",
    icon: SlashIcons.googleDrive,
    command: ({ editor }) => {
      // TODO: your integration
    },
  },
  {
    title: "GitHub",
    description: "Embed PR or issue",
    icon: SlashIcons.github,
    command: ({ editor }) => {
      // TODO: integration
    },
  },
  {
    title: "Slack",
    description: "Embed Slack message",
    icon: SlashIcons.slack,
    command: ({ editor }) => {
      // TODO: integration
    },
  },
];

export const SlashMenuExtension = Extension.create({
  name: "slashMenu",

  addProseMirrorPlugins(): Plugin[] {
    const plugin = Suggestion<SlashItem>({
      editor: this.editor,
      char: "/",
      startOfLine: true, // Notion-like: only at start of a block
      allowSpaces: true,

      //search
      items: ({ query }) => {
        console.log("[slash] items() query =", JSON.stringify(query));
        if (!query) return SLASH_ITEMS;
        const q = query.toLowerCase();
        return SLASH_ITEMS.filter((i) => i.title.toLowerCase().includes(q));
      },

      command: ({ editor, range, props }) => {
        console.log(
          "[slash] command:",
          props.title,
          "range:",
          range.from,
          range.to
        );
        editor.chain().focus().deleteRange(range).run();
        props.command({ editor });
      },

      // inside Suggestion({...})
      render: () => {
        let el: HTMLDivElement | null = null;
        let cleanup: (() => void) | null = null;
        let root: Root | null = null;
        const ensureEl = () => {
          if (el) return el;
          el = document.createElement("div");
          el.className = styles.shell;

          document.body.appendChild(el);
          root = createRoot(el);
          return el;
        };

        const renderItems = (
          items: SlashItem[],
          pick: (i: SlashItem) => void
        ) => {
          if (!el) return;
          let list = el.querySelector<HTMLDivElement>("[data-list]");
          if (!list) {
            list = document.createElement("div");
            list.setAttribute("data-list", "true");
            list.className = styles.list;
            el.appendChild(list);
          }
          list.innerHTML = "";

          items.forEach((item) => {
            const row = document.createElement("div");
            row.className = styles.item; //  row class
            row.onmouseenter = () => {}; // hover is CSS-only now
            row.onmouseleave = () => {};
            row.onmousedown = (e) => {
              e.preventDefault();
              pick(item);
            };
            const textWrap = document.createElement("div");
            const title = document.createElement("div");
            title.textContent = item.title;
            title.className = styles.title;

            const desc = document.createElement("div");
            desc.textContent = item.description;
            desc.className = styles.desc;

            textWrap.appendChild(title);
            textWrap.appendChild(desc);
            row.appendChild(textWrap);

            list.appendChild(row);
          });

          if (items.length === 0) {
            const empty = document.createElement("div");
            empty.textContent = "No results";
            empty.className = styles.desc;
            (list as HTMLDivElement).appendChild(empty);
          }
        };

        // recompute position using Floating UI
        const position = async (props: SuggestionProps<SlashItem>) => {
          if (!el || !props.clientRect) return;

          // Use a virtual element whose getBoundingClientRect is tiptap's caret rect
          const reference = { getBoundingClientRect: props.clientRect } as any;

          const { x, y, strategy } = await computePosition(reference, el!, {
            placement: "bottom-start",
            middleware: [
              offset(4),
              flip({ padding: 8 }), // flip above if not enough space below
              shift({ padding: 8 }), // nudge inside viewport if near edges
              size({
                padding: 8,
                // NOTE: availableHeight is provided here by the size() middleware
                apply({ availableHeight, elements }) {
                  const list =
                    elements.floating.querySelector<HTMLDivElement>(
                      "[data-list]"
                    );
                  if (list) {
                    list.style.maxHeight = `${Math.min(
                      availableHeight,
                      320
                    )}px`;
                    list.style.overflowY = "auto";
                  }
                },
              }),
            ],
          });

          // apply coordinates + strategy
          el!.style.position = strategy; // usually "fixed"
          el!.style.left = `${x}px`;
          el!.style.top = `${y}px`;
        };

        const startAutoUpdate = (props: SuggestionProps<SlashItem>) => {
          if (!props.clientRect || !el) return;
          const reference = { getBoundingClientRect: props.clientRect } as any;
          cleanup = autoUpdate(reference, el!, () => position(props));
        };

        return {
          onStart: (props) => {
            ensureEl();
            renderItems(props.items, (item) => {
              props.editor.chain().focus().deleteRange(props.range).run();
              item.command({ editor: props.editor as any });
            });
            position(props);
            startAutoUpdate(props);
          },
          onUpdate: (props) => {
            renderItems(props.items, (item) => {
              props.editor.chain().focus().deleteRange(props.range).run();
              item.command({ editor: props.editor as any });
            });
            position(props);
            // autoUpdate continues running
          },
          onKeyDown: () => false,
          onExit: () => {
            if (cleanup) {
              cleanup();
              cleanup = null;
            }
            if (el) {
              el.remove();
              el = null;
            }
          },
        };
      },
    });

    return [plugin as unknown as Plugin];
  },
});
