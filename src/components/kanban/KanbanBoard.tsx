"use client";

import { useEffect, useMemo, useState } from "react";
import { board as mockBoard, initialTasks } from "@/data/kanbanData";
import { USERS } from "@/data/users";
import { Board, Column, Task } from "@/types/kanban";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, ArrowUpRight } from "lucide-react";
import { AssigneePicker } from "./AssigneePicker";
import { AssigneeAvatar } from "./AssigneeAvatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditableText } from "./EditableText";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ---------------------------- small utilities ---------------------------- */
function useMediaQuery(query: string) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const cb = () => setM(mq.matches);
    cb();
    mq.addEventListener?.("change", cb);
    return () => mq.removeEventListener?.("change", cb);
  }, [query]);
  return m;
}

type TaskOrder = Record<string, string[]>; // columnId -> ordered task ids

function buildInitialTaskOrder(cols: Column[], tasks: Task[]): TaskOrder {
  const map: TaskOrder = {};
  cols.forEach((c) => (map[c.id] = []));
  tasks.forEach((t) => {
    if (!map[t.status]) map[t.status] = [];
    map[t.status].push(t.id);
  });
  return map;
}

/* --------------------------------- main --------------------------------- */
type Props = { board?: Board };

export default function KanbanBoard({ board = mockBoard }: Props) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  const [boardName, setBoardName] = useState(board.name);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Columns (stateful so we can re-order & add/delete)
  const initialCols: Column[] = [
    { id: "todo", title: "To Do" },
    { id: "inprogress", title: "In Progress" },
    { id: "review", title: "Review" },
    { id: "done", title: "Done" },
  ];
  const [cols, setCols] = useState<Column[]>(initialCols);

  // Track order of tasks per column for nice reordering
  const [taskOrder, setTaskOrder] = useState<TaskOrder>(
    buildInitialTaskOrder(initialCols, initialTasks)
  );

  // Sensors: small movement required before a drag starts (works well on touch)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const tasksById = useMemo(
    () => Object.fromEntries(tasks.map((t) => [t.id, t])),
    [tasks]
  );
  const userById = useMemo(
    () => Object.fromEntries(USERS.map((u) => [u.id, u])),
    []
  );

  // stub: wire this to your wiki route later
  function openTask(task: Task) {
    console.log("open task", task.id);
  }

  // Softer ghost icon button with good light/dark hover
  const iconBtn =
    "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 " +
    "dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800 " +
    "transition-colors";

  /* ------------------------------- CRUD -------------------------------- */
  const addColumn = () => {
    const newCol: Column = {
      id: crypto.randomUUID(),
      title: "Untitled Column",
    };
    setCols((prev) => [...prev, newCol]);
    setTaskOrder((prev) => ({ ...prev, [newCol.id]: [] }));
  };

  const deleteColumn = (colId: string) => {
    setCols((prev) => prev.filter((c) => c.id !== colId));
    setTasks((prev) => prev.filter((t) => t.status !== colId));
    setTaskOrder((prev) => {
      const copy = { ...prev };
      delete copy[colId];
      return copy;
    });
  };

  const addTask = (status: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: "Untitled Task",
      description: "Short description...",
      status,
      assigneeIds: [],
    };
    setTasks((prev) => [newTask, ...prev]);
    setTaskOrder((prev) => ({
      ...prev,
      [status]: [newTask.id, ...(prev[status] ?? [])],
    }));
  };

  const updateTask = (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const deleteTask = (id: string) => {
    const found = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (found) {
      setTaskOrder((prev) => ({
        ...prev,
        [found.status]: (prev[found.status] || []).filter((tid) => tid !== id),
      }));
    }
  };

  /* ---------------------------- DND handlers ---------------------------- */

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;

    const activeType = active.data.current?.type as
      | "column"
      | "task"
      | undefined;
    if (activeType !== "task") return;

    const activeTaskId = String(active.id);
    const fromCol = active.data.current?.columnId as string;
    const overType = over.data.current?.type as "column" | "task" | undefined;

    // Determine target column while hovering
    let toCol = fromCol;
    if (overType === "column") toCol = String(over.id);
    else if (overType === "task") toCol = String(over.data.current?.columnId);

    if (!toCol || toCol === fromCol) return;

    // Optimistic move between columns while hovering (feels snappier)
    setTaskOrder((prev) => {
      const next = { ...prev };
      next[fromCol] = (next[fromCol] || []).filter((id) => id !== activeTaskId);
      next[toCol] = [...(next[toCol] || []), activeTaskId];
      return next;
    });
    setTasks((prev) =>
      prev.map((t) => (t.id === activeTaskId ? { ...t, status: toCol } : t))
    );
    active.data.current = {
      ...active.data.current,
      columnId: toCol,
      type: "task",
    };
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;

    const activeType = active.data.current?.type as
      | "column"
      | "task"
      | undefined;

    if (activeType === "column") {
      if (active.id === over.id) return;
      const oldIndex = cols.findIndex((c) => c.id === active.id);
      const newIndex = cols.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      setCols((prev) => arrayMove(prev, oldIndex, newIndex));
      return;
    }

    if (activeType === "task") {
      const activeTaskId = String(active.id);
      const fromCol = String(active.data.current?.columnId);
      let toCol = fromCol;

      const overType = over.data.current?.type as "column" | "task" | undefined;
      if (overType === "column") toCol = String(over.id);
      if (overType === "task") toCol = String(over.data.current?.columnId);

      const overTaskId = overType === "task" ? String(over.id) : null;

      setTaskOrder((prev) => {
        const next = { ...prev };
        const fromArr = (next[fromCol] || []).filter(
          (id) => id !== activeTaskId
        );
        const toArr = [
          ...(next[toCol] || []).filter((id) => id !== activeTaskId),
        ];

        const insertIndex =
          overTaskId && toArr.includes(overTaskId)
            ? toArr.indexOf(overTaskId)
            : toArr.length;
        toArr.splice(insertIndex, 0, activeTaskId);

        next[fromCol] = fromArr;
        next[toCol] = toArr;
        return next;
      });

      if (toCol !== fromCol) {
        setTasks((prev) =>
          prev.map((t) => (t.id === activeTaskId ? { ...t, status: toCol } : t))
        );
      }
    }
  }

  /* -------------------------- Sortable shells -------------------------- */
  function SortableColumn({
    col,
    children,
  }: {
    col: Column;
    children: React.ReactNode;
  }) {
    const {
      setNodeRef,
      attributes,
      listeners,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: col.id, data: { type: "column" } });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.9 : 1,
      // helps touch scrolling not get eaten by drag handles
      touchAction: "pan-y",
    } as React.CSSProperties;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={[
          // width: phone ~85vw with a minimum; desktop fixed 20rem
          "relative z-10 flex flex-col rounded-xl p-3 flex-shrink-0 bg-muted border border-border",
          "snap-start sm:snap-none",
          "w-[85vw] min-w-[260px] sm:w-80",
        ].join(" ")}
      >
        {/* Column header (sticky on mobile so title/actions stay visible) */}
        <div className="sticky top-0 z-10 -mx-3 mb-3 px-3 pt-1 pb-2 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/70 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                {...listeners}
                {...attributes}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md
                           text-muted-foreground hover:text-foreground
                           hover:bg-neutral-100 dark:hover:bg-neutral-800
                           cursor-grab active:cursor-grabbing"
                title="Drag column"
              >
                <GripVertical className="h-5 w-5" />
              </span>

              <EditableText
                value={col.title}
                onChange={(v) =>
                  setCols((prev) =>
                    prev.map((c) =>
                      c.id === col.id
                        ? { ...c, title: v || "Untitled Column" }
                        : c
                    )
                  )
                }
                className="text-base font-semibold text-foreground"
              />

              <Badge className="bg-neutral-200/80 text-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-300">
                {(taskOrder[col.id] || []).length}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => addTask(col.id)}
                className={iconBtn}
                aria-label={`Add task to ${col.title}`}
              >
                <Plus className="h-5 w-5" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={iconBtn}
                    aria-label={`Delete column ${col.title}`}
                    title="Delete column"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete “{col.title || "Untitled Column"}”?
                    </AlertDialogTitle>
                  </AlertDialogHeader>
                  <p className="text-sm text-muted-foreground mt-2">
                    This will also remove {(taskOrder[col.id] || []).length}{" "}
                    task
                    {(taskOrder[col.id] || []).length === 1 ? "" : "s"} in this
                    column.
                  </p>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => deleteColumn(col.id)}
                    >
                      Delete column
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {children}
      </div>
    );
  }

  function TaskListDroppable({
    colId,
    children,
  }: {
    colId: string;
    children: React.ReactNode;
  }) {
    const { setNodeRef } = useDroppable({
      id: colId,
      data: { type: "column" },
    });
    return (
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 overflow-y-auto pr-1
                   max-h-[calc(100dvh-240px)] sm:max-h-[75vh]"
      >
        {children}
      </div>
    );
  }

  function SortableTaskCard({ task }: { task: Task }) {
    const {
      setNodeRef,
      attributes,
      listeners,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: task.id,
      data: { type: "task", columnId: task.status },
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.7 : 1,
      touchAction: "manipulation",
    } as React.CSSProperties;

    const assigned = task.assigneeIds.map((id) => userById[id]).filter(Boolean);

    return (
      <Card
        ref={setNodeRef}
        style={style}
        className="border border-border bg-card text-card-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/5"
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                {...listeners}
                {...attributes}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md
                           text-muted-foreground hover:text-foreground
                           hover:bg-neutral-100 dark:hover:bg-neutral-800
                           cursor-grab active:cursor-grabbing"
                title="Drag task"
              >
                <GripVertical className="h-5 w-5" />
              </span>

              <EditableText
                value={task.title}
                onChange={(v) =>
                  updateTask(task.id, { title: v || "Untitled Task" })
                }
                placeholder="Untitled Task"
                className="text-sm font-medium"
              />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  openTask(task);
                }}
                className={`h-8 w-8 ${iconBtn}`}
                aria-label="open task"
                title="open task"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${iconBtn}`}
                    aria-label="Delete task"
                    title="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <EditableText
            value={task.description || ""}
            onChange={(v) => updateTask(task.id, { description: v })}
            placeholder="Short description..."
            kind="textarea"
            className="text-xs text-muted-foreground mb-2"
            maxLength={300}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center -space-x-2">
              {assigned.slice(0, 4).map((u) => (
                <AssigneeAvatar key={u.id} user={u} title={u.name} />
              ))}
              {assigned.length > 4 && (
                <span
                  className="relative z-10 inline-flex h-6 w-6 items-center justify-center
                             rounded-full bg-pink-600 text-white text-xs font-medium
                             ring-2 ring-white dark:ring-neutral-900"
                  title={`${assigned.length - 4} more`}
                >
                  +{assigned.length - 4}
                </span>
              )}
            </div>

            <AssigneePicker
              allUsers={USERS}
              selectedIds={task.assigneeIds}
              onChange={(ids) => updateTask(task.id, { assigneeIds: ids })}
              label={isMobile ? "Assign" : "Add Assignees"}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  /* -------------------------------- render ------------------------------- */
  return (
    <div className="min-h-screen p-4 sm:p-6 bg-background text-foreground">
      {/* Title row */}
      <div className="mb-4 sm:mb-6">
        <EditableText
          value={boardName}
          onChange={setBoardName}
          placeholder="Untitled Board"
          className="text-2xl sm:text-3xl font-bold px-2 py-2 truncate"
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={() => {}}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={cols.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div
            className={[
              "relative flex gap-3 sm:gap-4 w-full",
              "overflow-x-auto sm:overflow-x-auto",
              "snap-x snap-mandatory sm:snap-none",
              "-mx-3 px-3 sm:mx-0 sm:px-0",
            ].join(" ")}
          >
            {cols.map((col) => {
              const ids = taskOrder[col.id] ?? [];
              return (
                <SortableColumn key={col.id} col={col}>
                  {/* droppable task area inside column */}
                  <TaskListDroppable colId={col.id}>
                    <SortableContext
                      items={ids}
                      strategy={verticalListSortingStrategy}
                    >
                      {ids.map((tid) => {
                        const task = tasksById[tid];
                        return task ? (
                          <SortableTaskCard key={tid} task={task} />
                        ) : null;
                      })}
                    </SortableContext>
                  </TaskListDroppable>
                </SortableColumn>
              );
            })}

            {/* Add Column */}
            <button
              onClick={addColumn}
              className="flex flex-col items-center justify-center
                         w-[70vw] min-w-[220px] sm:w-64 h-24 flex-shrink-0
                         border-2 border-dashed rounded-xl
                         border-neutral-300 dark:border-neutral-700
                         text-neutral-500 dark:text-neutral-400
                         hover:text-neutral-700 hover:border-neutral-400
                         dark:hover:text-neutral-200 dark:hover:border-neutral-500
                         transition snap-start sm:snap-none"
            >
              <Plus className="h-6 w-6 mb-1" />
              <span className="text-sm font-medium">Add Column</span>
            </button>

            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 z-0 bg-gradient-to-r from-background/95 to-transparent sm:hidden" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 z-0 bg-gradient-to-l from-background/95 to-transparent sm:hidden" />
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
