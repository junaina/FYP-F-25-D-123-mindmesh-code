

import {
  Node,
  mergeAttributes,
  type Command,
  type CommandProps,
} from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "prosemirror-state";
import type { EditorState } from "prosemirror-state";
import type { Node as PMNode } from "prosemirror-model";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from "@tiptap/react";
import { ChevronRight } from "lucide-react";
import React from "react";
//extending commands to include our custom commands
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggle: {
      /** Insert a new toggle block and focus the summary */
      insertToggle: () => ReturnType;
      /** Flip open/closed state of the nearest parent toggle */
      toggleToggleOpen: () => ReturnType;
      /** Move the caret from the summary into the body */
      focusToggleBody: () => ReturnType;
    };
  }
}
/* ================================
   React NodeView for toggleSummary
   ================================ */
const ToggleSummaryView = (_props: NodeViewProps) => {
  //wiring the chevron button here
  const onToggleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent focus change
    e.stopPropagation();
    const views = _props.editor.view;
    const getPos = _props.getPos as (() => number) | undefined;
    if (!views || !getPos) return;
    const pos = getPos();
    const { state } = views;
    const $pos = state.doc.resolve(pos);
    for (let depth = $pos.depth; depth >= 0; depth--) {
      const n = $pos.node(depth);
      if (n.type.name === "toggle") {
        const p = depth === 0 ? 0 : $pos.before(depth);
        const tr = state.tr.setNodeMarkup(p, undefined, {
          ...n.attrs,
          open: !n.attrs.open,
        });
        views.dispatch(tr);
        views.focus();
        console.log("toggle clicked");
        return;
      }
    }
  };
  return (
    <NodeViewWrapper
      data-toggle-summary=""
      className="group/summary -ml-1 px-1.5 py-1 rounded-md flex items-start gap-2
            hover:bg-muted/60 focus-within:bg-muted/60 transition-colors"
    >
      <button
        type="button"
        data-action="toggle-open"
        className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs border-transparent hover:bg-muted focus:outline-none"
        contentEditable={false}
        onMouseDown={onToggleMouseDown}
      >
        {/* Rotation handled via CSS based on parent [data-open] */}
        <ChevronRight
          className="h-4 w-4 transition-transform mm-toggle-icon
                         group-data-[open=true]/toggle:rotate-90"
        />
      </button>

      {/* Inline editable summary text */}
      <div className="min-w-0 flex-1 text-foreground/90">
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
};

/* ================
   Child: Summary
   ================ */
export const ToggleSummary = Node.create({
  name: "toggleSummary",
  content: "inline*",
  defining: true,
  selectable: false,
  isolating: true,

  parseHTML() {
    return [{ tag: "div[data-toggle-summary]" }];
  },

  // Keep renderHTML for HTML/SSR output
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        {
          "data-toggle-summary": "",
          class: "group/summary flex items-start gap-2",
        },
        HTMLAttributes
      ),
      ["div", { class: "min-w-0 flex-1 text-foreground/90" }, 0],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleSummaryView);
  },
});

/* =============
   Child: Body
   ============= */
export const ToggleBody = Node.create({
  name: "toggleBody",
  content: "block+",
  defining: true,
  selectable: false,
  isolating: true,

  parseHTML() {
    return [{ tag: "div[data-toggle-body]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-toggle-body": "", class: "pl-7 pt-2" },
        HTMLAttributes
      ),
      0,
    ];
  },
});

/* =============
   Parent: Toggle
   ============= */
export const Toggle = Node.create({
  name: "toggle",
  group: "block",
  content: "toggleSummary toggleBody",
  defining: true,
  isolating: true,
  draggable: false,

  addAttributes() {
    return {
      open: {
        default: true as boolean,
        parseHTML: (el: HTMLElement) =>
          el.getAttribute("data-open") !== "false",
        renderHTML: (attrs: { open: boolean }) => ({
          "data-open": attrs.open ? "true" : "false",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="toggle"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        {
          "data-type": "toggle",
          class:
            "group/toggle my-1 rounded-md border border-transparent data-[open=false]:opacity-90",
        },
        HTMLAttributes
      ),
      0,
    ];
  },

  addCommands() {
    return {
      insertToggle:
        () =>
        ({ chain }: CommandProps) => {
          const ok = chain()
            .insertContent({
              type: this.name, // "toggle"
              attrs: { open: true },
              content: [
                { type: "toggleSummary", content: [] },
                { type: "toggleBody", content: [{ type: "paragraph" }] },
              ],
            })
            .run();

          return ok; // MUST return boolean for Command
        },

      toggleToggleOpen:
        () =>
        ({ state, dispatch }: CommandProps) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === this.name) {
              const pos = $from.before(depth);
              const tr = state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                open: !node.attrs.open,
              });
              if (dispatch) dispatch(tr);
              return true;
            }
          }
          return false;
        },

      focusToggleBody:
        () =>
        ({ state, view }: CommandProps) => {
          if (!view) return false;
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === this.name) {
              const pos = $from.before(depth);
              let childPos = pos + 1;
              for (let i = 0; i < node.childCount; i++) {
                const child = node.child(i);
                if (child.type.name === "toggleBody") {
                  const bodyPos = childPos + 1;
                  const sel = TextSelection.near(
                    view.state.doc.resolve(bodyPos)
                  );
                  view.dispatch(
                    view.state.tr.setSelection(sel).scrollIntoView()
                  );
                  return true;
                }
                childPos += child.nodeSize;
              }
            }
          }
          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Enter in Summary -> move caret to Body
      Enter: ({ editor }) => {
        const { $from } = editor.state.selection;
        if ($from.parent.type.name === "toggleSummary") {
          return editor.commands.focusToggleBody();
        }
        return false;
      },

      // ArrowLeft at start of Body -> jump to end of Summary
      ArrowLeft: ({ editor }) => {
        const { state, view } = editor;
        const { $from, empty } = state.selection;
        if (!empty) return false;
        if ($from.parent.type.name !== "toggleBody") return false;
        if ($from.parentOffset !== 0) return false;

        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === this.name) {
            const pos = $from.before(depth);
            let childPos = pos + 1;
            for (let i = 0; i < node.childCount; i++) {
              const child = node.child(i);
              if (child.type.name === "toggleSummary") {
                const end = childPos + child.nodeSize - 1;
                const sel = TextSelection.near(state.doc.resolve(end));
                view?.dispatch(state.tr.setSelection(sel).scrollIntoView());
                return true;
              }
              childPos += child.nodeSize;
            }
          }
        }
        return false;
      },

      // Backspace on empty Summary -> remove entire toggle
      Backspace: ({ editor }) => {
        const { state, view } = editor;
        const { $from } = state.selection;
        if ($from.parent.type.name !== "toggleSummary") return false;
        if ($from.parent.content.size > 0) return false;

        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === this.name) {
            const pos = $from.before(depth);
            view?.dispatch(state.tr.delete(pos, pos + node.nodeSize));
            return true;
          }
        }
        return false;
      },

      "Mod-\\": ({ editor }) => editor.commands.toggleToggleOpen(),
    };
  },

  addProseMirrorPlugins() {
    const key = new PluginKey("toggle-click-plugin");
    return [
      new Plugin({
        key,
        props: {
          handleClickOn: (view, pos, _node, _nodePos, event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest?.('[data-action="toggle-open"]')) {
              const { state } = view;
              const $pos = state.doc.resolve(pos);
              for (let depth = $pos.depth; depth >= 0; depth--) {
                const n = $pos.node(depth);
                if (n.type.name === this.name) {
                  const p = depth === 0 ? 0 : $pos.before(depth);
                  const tr = state.tr.setNodeMarkup(p, undefined, {
                    ...n.attrs,
                    open: !n.attrs.open,
                  });
                  view.dispatch(tr);
                  return true;
                }
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});
