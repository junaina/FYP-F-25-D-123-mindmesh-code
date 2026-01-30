// src/components/desk/view-registry.tsx
import DocumentView from "./views/DocumentView";
import DiscussionsView from "./views/DiscussionsView";
const ThreadView = ({ id }: { id: string }) => (
  <div className="p-4">Thread {id}</div>
);

// stubs (later)
const MeetingView = ({ id }: { id: string }) => (
  <div className="p-4">Meeting {id}</div>
);
const TaskBoardView = ({ id }: { id: string }) => (
  <div className="p-4">TaskBoard {id}</div>
);
const AskMindyView = ({ id }: { id: string }) => (
  <div className="p-4">Ask Mindy {id}</div>
);

export const viewRegistry = {
  document: DocumentView,
  discussions: DiscussionsView,
  thread: ThreadView,
  meeting: MeetingView,
  taskboard: TaskBoardView,
  askmindy: AskMindyView,
} as const;
