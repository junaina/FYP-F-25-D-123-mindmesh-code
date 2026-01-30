// src/components/desk/view-registry.tsx
import DocumentView from "./views/DocumentView";
import DiscussionsView from "./views/DiscussionsView";
import MeshMeetView from "./views/MeshMeetView";
import TaskboardView from "./views/TaskboardView";
import AskMindyView from "./views/AskMindyView";

const ThreadView = ({ id }: { id: string }) => (
  <div className="p-4">Thread {id}</div>
);

export const viewRegistry = {
  document: DocumentView,
  discussions: DiscussionsView,
  thread: ThreadView,
  meshmeet: MeshMeetView,
  taskboard: TaskboardView,
  askmindy: AskMindyView,
} as const;
