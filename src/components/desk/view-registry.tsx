// src/components/desk/view-registry.tsx
import DocumentView from "./views/DocumentView";

const ThreadView = ({ id }: { id: string }) => (
  <div className="p-4">Thread {id}</div>
);
const MeetingView = ({ id }: { id: string }) => (
  <div className="p-4">Meeting {id}</div>
);
const TaskBoardView = ({ id }: { id: string }) => (
  <div className="p-4">TaskBoard {id}</div>
);

export const viewRegistry = {
  document: DocumentView,
  thread: ThreadView,
  meeting: MeetingView,
  taskboard: TaskBoardView,
} as const;
