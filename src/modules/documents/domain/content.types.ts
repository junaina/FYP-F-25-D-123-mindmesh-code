import type { JSONContent } from "@tiptap/core";

/** The persisted Tiptap document (root node “doc”). */
export type DocContent = JSONContent;

/** Keep a single source of truth for what you *intend* to support. */
export const ALLOWED_NODE_TYPES = [
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "taskList",
  "taskItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "hardBreak",
  "image",
] as const;

export const ALLOWED_MARK_TYPES = [
  "bold",
  "italic",
  "strike",
  "code",
  "link",
] as const;
export type AllowedNode = (typeof ALLOWED_NODE_TYPES)[number];
export type AllowedMark = (typeof ALLOWED_MARK_TYPES)[number];
