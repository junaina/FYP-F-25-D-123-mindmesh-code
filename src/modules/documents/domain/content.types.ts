import type { JSONContent } from "@tiptap/core";

export type DocContent = JSONContent;

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
