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
import type {
  EmbedRow,
  GoogleDriveEmbedMeta,
} from "@/modules/documents/domain/embed.types";
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
    command: ({ editor }) => editor.chain().focus().insertToggle().run(),
  },
  // {
  //   title: "Google Drive",
  //   description: "Embed a doc from Google Drive",
  //   icon: SlashIcons.googleDrive,
  //   command: ({ editor }) => {
  //     // TODO: your integration
  //   },
  // },

  {
    title: "Slack",
    description: "Embed Slack message",
    icon: SlashIcons.slack,
    command: ({ editor }) => {
      // TODO: integration
    },
  },
];
export type SlashMenuOptions = { extraItems?: SlashItem[] };
export function SlashMenuExtension(options?: SlashMenuOptions) {
  return Extension.create({
    name: "slashMenu",
    addOptions() {
      return {
        extraItems: options?.extraItems ?? [],
      };
    },
    addProseMirrorPlugins(): Plugin[] {
      const plugin = Suggestion<SlashItem>({
        editor: this.editor,
        char: "/",
        startOfLine: true, // Notion-like: only at start of a block
        allowSpaces: true,

        //search
        items: ({ query }) => {
          console.log("[slash] items() query =", JSON.stringify(query));
          const ALL = [
            ...SLASH_ITEMS,
            ...(this.options.extraItems as SlashItem[]),
          ];
          console.log(
            "[slash] extraItems count =",
            (this.options.extraItems as SlashItem[]).length,
          ); // <-- ADD
          if (!query) return ALL;
          const q = query.toLowerCase();
          return ALL.filter((i) => i.title.toLowerCase().includes(q));
        },

        command: ({ editor, range, props }) => {
          console.log(
            "[slash] command picked:",
            props.title,
            "range:",
            range.from,
            range.to,
          );
          editor.chain().focus().deleteRange(range).run();
          props.command({ editor });
        },

        // inside Suggestion({...})
        render: () => {
          let el: HTMLDivElement | null = null;
          let cleanup: (() => void) | null = null;
          let root: Root | null = null;
          let lastEditor: any | null = null;
          let lastRange: { from: number; to: number } | null = null;

          // NEW: keyboard state
          let selectedIndex = 0;
          let currentItems: SlashItem[] = [];
          const ensureEl = () => {
            if (el) return el;
            el = document.createElement("div");
            el.className = styles.shell;

            document.body.appendChild(el);
            root = createRoot(el);
            return el;
          };

          // Keep a reference to the list element
          const ensureList = () => {
            if (!el) return null;
            let list = el.querySelector<HTMLDivElement>("[data-list]");
            if (!list) {
              list = document.createElement("div");
              list.setAttribute("data-list", "true");
              list.className = styles.list;
              el.appendChild(list);
            }
            return list;
          };
          const scrollIntoViewIfNeeded = (
            container: HTMLElement,
            item: HTMLElement,
          ) => {
            const cTop = container.scrollTop;
            const cBottom = cTop + container.clientHeight;
            const iTop = item.offsetTop;
            const iBottom = iTop + item.offsetHeight;
            if (iTop < cTop) container.scrollTop = iTop;
            else if (iBottom > cBottom)
              container.scrollTop = iBottom - container.clientHeight;
          };

          const clamp = (n: number, min: number, max: number) =>
            Math.max(min, Math.min(max, n));
          const renderItems = (
            items: SlashItem[],
            pick: (i: SlashItem) => void,
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
            currentItems = items;

            // Keep selectedIndex in range
            selectedIndex = clamp(
              selectedIndex,
              0,
              Math.max(0, items.length - 1),
            );

            items.forEach((item, idx) => {
              const row = document.createElement("div");
              row.className =
                styles.item +
                (idx === selectedIndex ? " " + styles.active : "");
              row.setAttribute("role", "option");
              row.setAttribute(
                "aria-selected",
                idx === selectedIndex ? "true" : "false",
              );
              row.dataset.index = String(idx);
              // Mouse interactions (don’t steal focus)
              row.onmouseenter = () => {
                selectedIndex = idx;
                // only re-style this row quickly:
                [...list.children].forEach(
                  (child, i) =>
                    ((child as HTMLElement).className =
                      styles.item +
                      (i === selectedIndex ? " " + styles.active : "")),
                );
              };
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
            } else {
              // ensure the active row is visible if the list is scrollable
              const active = list.querySelector<HTMLElement>(
                `[data-index="${selectedIndex}"]`,
              );
              if (active) scrollIntoViewIfNeeded(list, active);
            }
          };

          // recompute position using Floating UI
          const position = async (props: SuggestionProps<SlashItem>) => {
            if (!el || !props.clientRect) return;

            // Use a virtual element whose getBoundingClientRect is tiptap's caret rect
            const reference = {
              getBoundingClientRect: props.clientRect,
            } as any;

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
                        "[data-list]",
                      );
                    if (list) {
                      list.style.maxHeight = `${Math.min(
                        availableHeight,
                        320,
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
            const reference = {
              getBoundingClientRect: props.clientRect,
            } as any;
            cleanup = autoUpdate(reference, el!, () => position(props));
          };

          return {
            onStart: (props) => {
              ensureEl();
              selectedIndex = 0;
              lastEditor = props.editor; // <-- cache
              lastRange = props.range;
              renderItems(props.items, (item) => {
                props.editor.chain().focus().deleteRange(props.range).run();
                item.command({ editor: props.editor as any });
              });
              position(props);
              startAutoUpdate(props);
            },
            onUpdate: (props) => {
              lastEditor = props.editor; // <-- refresh cache
              lastRange = props.range; // <-- refresh cache
              renderItems(props.items, (item) => {
                props.editor.chain().focus().deleteRange(props.range).run();
                item.command({ editor: props.editor as any });
              });
              position(props);
              // autoUpdate continues running
            },
            // NEW: keyboard nav
            onKeyDown: ({ event, range }) => {
              if (!currentItems.length) return false;
              if (!lastEditor || !lastRange) return false; // safety guard

              const runSelected = () => {
                const item = currentItems[selectedIndex];
                if (!item) return false;
                lastEditor.chain().focus().deleteRange(lastRange).run();
                item.command({ editor: lastEditor });
                return true;
              };

              const list = el?.querySelector<HTMLDivElement>("[data-list]");
              if (!list) return false;

              switch (event.key) {
                case "ArrowDown":
                  event.preventDefault();
                  selectedIndex = clamp(
                    selectedIndex + 1,
                    0,
                    currentItems.length - 1,
                  );
                  renderItems(currentItems, () => {});
                  return true;
                case "ArrowUp":
                  event.preventDefault();
                  selectedIndex = clamp(
                    selectedIndex - 1,
                    0,
                    currentItems.length - 1,
                  );
                  renderItems(currentItems, () => {});
                  return true;
                case "Home":
                  event.preventDefault();
                  selectedIndex = 0;
                  renderItems(currentItems, () => {});
                  return true;
                case "End":
                  event.preventDefault();
                  selectedIndex = currentItems.length - 1;
                  renderItems(currentItems, () => {});
                  return true;
                case "Enter":
                  event.preventDefault();
                  return runSelected();
                case "Escape":
                  // let Suggestion close it
                  return false;
                default:
                  return false; // allow other keys (typing) to update the query
              }
            },
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
}
