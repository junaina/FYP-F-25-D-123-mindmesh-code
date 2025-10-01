// src/components/wiki/extensions/SlashMenuExtension.ts
import { Extension, type Editor } from "@tiptap/core";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";
import type { Plugin } from "prosemirror-state";
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
  command: (ctx: { editor: Editor }) => void;
};

const SLASH_ITEMS: SlashItem[] = [
  {
    title: "Heading 1",
    description: "Big section heading",
    command: ({ editor }) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    command: ({ editor }) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Bullet List",
    description: "Create a bulleted list",
    command: ({ editor }) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    command: ({ editor }) => editor.chain().focus().toggleOrderedList().run(),
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

        const ensureEl = () => {
          if (el) return el;
          el = document.createElement("div");
          Object.assign(el.style, {
            // Floating UI will return `strategy`; we’ll set style.position accordingly.
            zIndex: "9999",
            background: "var(--editor-popover-bg, #fff)",
            color: "var(--editor-text, #111827)",
            border: "1px solid var(--editor-border, rgba(0,0,0,0.12))",
            borderRadius: "10px",
            boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
            padding: "6px",
            minWidth: "260px",
            maxWidth: "360px",
            overflow: "hidden",
          } as CSSStyleDeclaration);
          document.body.appendChild(el);
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
            Object.assign(list.style, {
              // height will be clamped by `size()` middleware; this just provides a hard cap
              maxHeight: "320px",
              overflowY: "auto",
            } as CSSStyleDeclaration);
            el.appendChild(list);
          }
          list.innerHTML = "";

          items.forEach((item) => {
            const row = document.createElement("div");
            Object.assign(row.style, {
              padding: "8px 10px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "grid",
              gridTemplateRows: "auto auto",
              gap: "2px",
            } as CSSStyleDeclaration);
            row.onmouseenter = () =>
              (row.style.background = "rgba(0,0,0,0.06)");
            row.onmouseleave = () => (row.style.background = "transparent");
            row.onmousedown = (e) => {
              e.preventDefault();
              pick(item);
            };

            const title = document.createElement("div");
            title.textContent = item.title;
            title.style.fontWeight = "600";

            const desc = document.createElement("div");
            desc.textContent = item.description;
            desc.style.opacity = "0.65";
            desc.style.fontSize = "12px";

            row.appendChild(title);
            row.appendChild(desc);
            list.appendChild(row);
          });

          if (items.length === 0) {
            const empty = document.createElement("div");
            empty.textContent = "No results";
            Object.assign(empty.style, { padding: "8px 10px", opacity: "0.6" });
            list.appendChild(empty);
          }
        };

        // Recompute position using Floating UI
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
