import KanbanBoard from "@/components/kanban/KanbanBoard";
import { board } from "@/data/kanbanData";

export default function BoardPage() {
  return <KanbanBoard board={board} />; // title now comes from board prop
}
