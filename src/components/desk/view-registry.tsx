// src/components/desk/view-registry.tsx
import DocumentView from "./views/DocumentView";
import DiscussionsView from "./views/DiscussionsView";
import MeshMeetView from "./views/MeshMeetView";
import TaskboardView from "./views/TaskboardView";

const ThreadView = ({ id }: { id: string }) => (
  <div className="p-4">Thread {id}</div>
);

const AskMindyView = ({ id }: { id: string }) => (
  <div className="p-4">Ask Mindy {id}</div>
);

export const viewRegistry = {
  document: DocumentView,
  discussions: DiscussionsView,
  thread: ThreadView,
  meshmeet: MeshMeetView,
  taskboard: TaskboardView,
  askmindy: AskMindyView,
} as const;
