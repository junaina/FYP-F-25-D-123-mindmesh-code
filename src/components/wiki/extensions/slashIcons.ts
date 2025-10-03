// src/components/wiki/extensions/slashIcons.ts
import type { LucideIcon } from "lucide-react";
import {
  // Headings & text
  Heading1,
  Heading2,
  Heading3,
  Text as TextIcon,
  FileText,

  // Lists
  List,
  ListOrdered,
  ListTodo,
  ListCollapse,

  // Media
  Image as ImageIcon,
  Video,
  File,
  Code,
  Mic,

  // Integrations
  FileSpreadsheet,
  Github,
  Slack,

  // Layout / toggles
  Maximize2,
  Minimize2,

  // Export
  FileDown,

  // Properties / metadata
  Hash,
  Calendar,
  AtSign,
  User,
  CheckSquare,
  Link2,
} from "lucide-react";

// If you want key safety elsewhere:
export type SlashIconKey = keyof typeof SlashIcons;

export const SlashIcons = {
  // Headings & text
  heading1: Heading1,
  heading2: Heading2,
  heading3: Heading3,
  text: TextIcon,
  doc: FileText,

  // Lists
  bulletedList: List,
  numberedList: ListOrdered,
  todoList: ListTodo,
  toggleList: ListCollapse,

  // Media embeds
  image: ImageIcon,
  video: Video,
  file: File,
  code: Code,
  audio: Mic,

  // External integrations
  googleDrive: FileSpreadsheet, // or swap to Database if you prefer
  github: Github,
  slack: Slack,

  // Document layout
  fullWidthOn: Maximize2,
  fullWidthOff: Minimize2,
  smallText: TextIcon, // simple "T" glyph

  // Export
  exportPdf: FileDown,

  // Properties / metadata
  number: Hash,
  select: List,
  multiSelect: ListTodo,
  dateTime: Calendar,
  email: AtSign,
  person: User,
  checkbox: CheckSquare,
  fileProperty: File,
  relation: Link2,
} satisfies Record<string, LucideIcon>;
