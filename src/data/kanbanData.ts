import type { Board, Task } from "@/types/kanban";

export const board: Board = {
  id: "demo-board",
  name: "project board",
};

export const initialTasks: Task[] = [
  // to-do
  {
    id: "t-auth-ux",
    status: "todo",
    title: "design auth flow (rough)",
    description: "email + password for now. ",
    assigneeIds: ["ava"],
  },
  {
    id: "t-tests-sanity",
    status: "todo",
    title: "write a couple of sanity tests",
    description: "vitest, just make sure the page actually renders.",
    assigneeIds: ["max"],
  },

  // in progress
  {
    id: "t-shadcn",
    status: "inprogress",
    title: "hook shadcn bits",
    description:
      "install theme + tokens. if icons look weird, it’s probably me.",
    assigneeIds: ["zoe", "ava"],
  },
  {
    id: "t-copy-pass",
    status: "inprogress",
    title: "touch up micro-copy",
    description: "make buttons sound less robotic. one exclamation point max",
    assigneeIds: [],
  },

  // review
  {
    id: "t-boot-project",
    status: "review",
    title: "set up project",
    description:
      "boot next.js + tailwind + shadcn. try not to yak-shave webpack configs.",
    assigneeIds: ["nia"],
  },
  {
    id: "t-accessibility-pass",
    status: "review",
    title: "quick a11y pass",
    description:
      "tab through the board, fix anything obviously annoying. bonus: focus rings that aren’t ugly.",
    assigneeIds: ["luis"],
  },

  // done
  {
    id: "t-readme",
    status: "done",
    title: "readme (short & honest)",
    description:
      "how to run it, how to break it, and where the bodies are buried. 🪦",
    assigneeIds: ["max"],
  },
  {
    id: "t-ui-polish",
    status: "done",
    title: "tiny ui polish",
    description:
      "spacing + contrast pass. if it feels nicer but you can’t say why, that’s this task.",
    assigneeIds: ["zoe"],
  },
];
