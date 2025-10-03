// src/components/wiki/extensions/CustomTaskItem.ts
import TaskItem from "@tiptap/extension-task-item";

export const CustomTaskItem = TaskItem.extend({
  addKeyboardShortcuts() {
    // Keep parent shortcuts and override the two we care about
    return {
      ...this.parent?.(),

      // Enter → new task item (checkbox) instead of a new paragraph inside the same item
      Enter: () => {
        return this.editor.commands.splitListItem(this.name);
      },

      // Shift+Enter → hard break inside the same item (optional, feels nice)
      "Shift-Enter": () => {
        return this.editor.commands.setHardBreak();
      },

      // Backspace at start → lift out of list (remove checkbox)
      Backspace: () => {
        const { state } = this.editor;
        const { selection } = state;
        if (!selection.empty) return false;

        const $from = selection.$from;
        const inTaskItem = $from.node(-1)?.type.name === this.name;
        const atStartOfTextblock = $from.parentOffset === 0;

        if (!inTaskItem || !atStartOfTextblock) return false;

        return this.editor.chain().focus().liftListItem(this.name).run();
      },
    };
  },
});
