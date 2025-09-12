import type { LucideIcon } from "lucide-react";
import type { Assignee } from "@/types/kanban";
export type QuickAction = {
  id: string;
  label: string;
  href?: string;
  iconName?: "file-plus-2" | "message-square-plus" | "video" | "plus";
};


export type EntityBase = {
  id: string;
  title: string;
  description?: string;
  href?: string;
};

export type DocItem = EntityBase & {
  cover?: string;        // image url
  placeholder?: string;  // Tailwind classes when no image
};

export type TaskItem = EntityBase & {
  status?: "todo" | "doing" | "done";
};

export type ThreadItem = EntityBase & {
  channel?: string; // e.g. "#general"
  unread?: boolean;
   assignees?: Assignee[]; 
};

export type ProjectOverview = {
  name: string;
  quickActions: QuickAction[];
  docs: DocItem[];
  tasks: TaskItem[];
  threads: ThreadItem[];
};
