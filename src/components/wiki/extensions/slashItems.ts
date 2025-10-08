// src/components/wiki/editor/slashItems.ts

export type SlashItem = {
  title: string;
  description: string;
  command: ({ editor }: { editor: any }) => void;
};

export const SLASH_ITEMS: SlashItem[] = [
  {
    title: "Heading 1",
    description: "Big section heading",
    command: ({ editor }) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    command: ({ editor }) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a bulleted list",
    command: ({ editor }) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    command: ({ editor }) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
];
