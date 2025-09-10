import { Task, Column, Board } from "@/types/kanban";

export const board: Board = {
  id: "board-1",
  name: "Project Board",
};

export const columns: Column[] = [
  { id: "todo", title: "To Do" },
  { id: "inprogress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

export const initialTasks: Task[] = [
  {
    id: "t1",
    title: "Set up project",
    description: "Boot Next.js, Tailwind, shadcn",
    status: "todo",
    assigneeIds: ["u_ava"],
  },
  {
    id: "t2",
    title: "Design auth UX",
    description: "Email+pass, magic link later",
    status: "inprogress",
    assigneeIds: ["u_max", "u_zoe"],
  },
  {
    id: "t3",
    title: "Hook shadcn components",
    description: "Install, theme, tokens",
    status: "inprogress",
    assigneeIds: [],
  },
  {
    id: "t4",
    title: "Write unit tests",
    description: "Vitest + RTL baseline",
    status: "review",
    assigneeIds: ["u_luis"],
  },
  {
    id: "t5",
    title: "Polish UI",
    description: "Spacing + contrast pass",
    status: "done",
    assigneeIds: ["u_nia"],
  },
];
