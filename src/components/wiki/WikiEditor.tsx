"use client";

import { type ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import type { JSONContent } from "@tiptap/core";

export type WikiEditorProps = {
  initialContent?: JSONContent | null;
  placeholder?: string;
  onChange?: (json: JSONContent) => void;
};

function Btn({
  onClick,
  active,
  children,
  ariaLabel,
}: {
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-sm border transition
        ${active ? "bg-muted" : "bg-background"} hover:bg-muted`}
    >
      {children}
    </button>
  );
}

export default function WikiEditor({
  initialContent,
  placeholder = "Type '/' for commands…",
  onChange,
}: WikiEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder }),
      Underline,
    ],
    content: initialContent ?? { type: "doc", content: [] },
    autofocus: "end",
    immediatelyRender: false, // avoid SSR hydration mismatch
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[60vh] focus:outline-none " +
          "prose-headings:font-semibold",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 border rounded-md p-2 bg-background">
        <Btn
          ariaLabel="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          Bold
        </Btn>
        <Btn
          ariaLabel="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          Italic
        </Btn>
        <Btn
          ariaLabel="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          Underline
        </Btn>
        <Btn
          ariaLabel="H1"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
        >
          H1
        </Btn>
        <Btn
          ariaLabel="H2"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
        >
          H2
        </Btn>
        <Btn
          ariaLabel="H3"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
        >
          H3
        </Btn>
        <Btn
          ariaLabel="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          • List
        </Btn>
        <Btn
          ariaLabel="Ordered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          1. List
        </Btn>
      </div>

      <div className="rounded-md border p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
