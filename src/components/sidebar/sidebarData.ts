// src/components/sidebar/sidebarData.ts
export interface SidebarProject {
  id: string;
  name: string;
  taskBoards: string[];
  askMindyChats: string[];
  discussions: string[];
  wiki: string[];
}

export const initialProjects: SidebarProject[] = [
  {
    id: "p1",
    name: "Project Alpha",
    taskBoards: ["Board 1", "Board 2"],
    askMindyChats: ["Chat A", "Chat B"],
    discussions: ["Thread 1", "Thread 2"],
    wiki: ["Doc A", "Doc B"],
  },
];
