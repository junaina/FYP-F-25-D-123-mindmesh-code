"use client";

import { useEffect, useMemo, useState } from "react";
import { USERS } from "@/data/users";
import { Column, Task } from "@/types/kanban";
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

import {
  getTaskboard,
  updateTaskboardName,
  createTaskboardColumn,
  renameTaskboardColumn,
  deleteTaskboardColumn,
  reorderTaskboardColumns,
  createTaskboardItem,
  updateTaskboardItem,
  deleteTaskboardItem,
  createStatusPropertyForTaskboard,
  updateTaskboardStatusBinding,
  type StatusPropertyDto,
  getTaskboardStatusProperties,
} from "@/modules/taskboard/client/taskboard.api";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

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
type Props = {
  projectId: string;
};

export default function TaskboardKanban({ projectId }: Props) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 640px)");

  const [boardName, setBoardName] = useState("Untitled Board");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cols, setCols] = useState<Column[]>([]);
  const [taskOrder, setTaskOrder] = useState<TaskOrder>({});
  const [statusPropertyId, setStatusPropertyId] = useState<string | null>(null);
  const [statusProperties, setStatusProperties] = useState<StatusPropertyDto[]>(
    [],
  );
  const [loadingBoard, setLoadingBoard] = useState(true);

  const [savingName, setSavingName] = useState(false);

  function openTask(task: Task) {
    if (!task.id) return;
    router.push(`/projects/${projectId}/docs/${task.id}`);
  }

  // Load board (name + columns + cards)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingBoard(true);

        // 1) load taskboard
        const board = await getTaskboard(projectId);
        if (cancelled) return;

        setBoardName(board.name);

        const boundStatusId = board.bindings?.statusPropertyId ?? null;
        setStatusPropertyId(boundStatusId);

        const apiCols = (board.columns ?? []) as any[];
        const mappedCols: Column[] = apiCols.map((c) => ({
          id: c.optionId ?? c.id,
          title: c.label ?? c.name ?? c.value ?? "Untitled Column",
        }));
        setCols(mappedCols);

        const apiCards = (board.cards ?? []) as any[];
        const mappedTasks: Task[] = apiCards.map((card) => ({
          id: card.id ?? card.documentId,
          title: card.title ?? "Untitled Task",
          description: card.description ?? "",
          status: card.columnId ?? card.optionId,
          assigneeIds: card.assigneeIds ?? [],
        }));
        setTasks(mappedTasks);
        setTaskOrder(buildInitialTaskOrder(mappedCols, mappedTasks));

        // 2) status properties for dropdown (usually just 1: Status)
        const statusResp = await getTaskboardStatusProperties(projectId);
        if (cancelled) return;

        setStatusProperties(statusResp.properties);

        if (statusResp.currentPropertyId !== undefined) {
          setStatusPropertyId(statusResp.currentPropertyId);
        }
      } catch (err) {
        console.error("Failed to load taskboard", err);
      } finally {
        if (!cancelled) setLoadingBoard(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Sensors: small movement required before a drag starts (works well on touch)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const tasksById = useMemo(
    () => Object.fromEntries(tasks.map((t) => [t.id, t])),
    [tasks],
  );
  const userById = useMemo(
    () => Object.fromEntries(USERS.map((u) => [u.id, u])),
    [],
  );

  const iconBtn =
    "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 " +
    "dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800 " +
    "transition-colors";

  /* ------------------------------- CRUD -------------------------------- */
  const addColumn = async () => {
    const baseLabel = "Untitled Column";
    const existingTitles = cols.map((c) => c.title);
    const uniqueLabel = makeUniqueColumnLabel(baseLabel, existingTitles);

    // CASE 1: status property bound → add option
    if (statusPropertyId) {
      try {
        const created = await createTaskboardColumn(
          projectId,
          statusPropertyId,
          uniqueLabel,
        );

        const newCol: Column = {
          id: created.id,
          title: created.title,
        };

        setCols((prev) => [...prev, newCol]);
        setTaskOrder((prev) => ({ ...prev, [newCol.id]: [] }));
      } catch (err) {
        console.error("Failed to create column", err);
      }
      return;
    }

    // CASE 2: no status property yet → create it + first option + bind it
    try {
      const property = await createStatusPropertyForTaskboard(projectId, {
        name: "Untitled status",
        options: [uniqueLabel],
      });

      const newStatusPropertyId = property.id;
      const firstOption = property.options[0];

      if (!firstOption) {
        throw new Error("Status property created without any options");
      }

      await updateTaskboardStatusBinding(projectId, newStatusPropertyId);

      const newCol: Column = {
        id: firstOption.id,
        title: firstOption.value ?? uniqueLabel,
      };

      setStatusPropertyId(newStatusPropertyId);
      setCols((prev) => [...prev, newCol]);
      setTaskOrder((prev) => ({ ...prev, [newCol.id]: [] }));
    } catch (err) {
      console.error("Failed to create status property + first column", err);
    }
  };

  const deleteColumn = async (colId: string) => {
    const prevCols = cols;
    const prevTasks = tasks;
    const prevOrder = taskOrder;

    setCols((p) => p.filter((c) => c.id !== colId));
    setTasks((p) => p.filter((t) => t.status !== colId));
    setTaskOrder((prev) => {
      const copy = { ...prev };
      delete copy[colId];
      return copy;
    });

    if (!statusPropertyId) return;

    try {
      await deleteTaskboardColumn(projectId, statusPropertyId, colId);
    } catch (err) {
      console.error("Failed to delete column", err);
      setCols(prevCols);
      setTasks(prevTasks);
      setTaskOrder(prevOrder);
    }
  };

  const addTask = async (status: string) => {
    if (!statusPropertyId) {
      console.warn("No status property bound for this taskboard");
      return;
    }

    try {
      const card = await createTaskboardItem(projectId, {
        propertyId: statusPropertyId,
        optionId: status,
        title: "Untitled Task",
      });

      const documentId = (card as any).id;
      if (!documentId) {
        console.error("Taskboard card returned without an id", card);
        return;
      }

      const newTask: Task = {
        id: documentId,
        title: card.title ?? "Untitled Task",
        description: card.description ?? "",
        status: card.columnId ?? status,
        assigneeIds: card.assigneeIds ?? [],
      };

      setTasks((prev) => [newTask, ...prev]);
      setTaskOrder((prev) => ({
        ...prev,
        [newTask.status]: [newTask.id, ...(prev[newTask.status] ?? [])],
      }));
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const updateTask = (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

    if (patch.title !== undefined) {
      if (!id || id === "undefined") {
        console.warn("Skipping title update: missing document id", {
          id,
          patch,
        });
        return;
      }

      void updateTaskboardItem(projectId, id, {
        title: patch.title,
      });
    }

    if (patch.description !== undefined) {
      void updateTaskboardItem(projectId, id, {
        description: patch.description ?? "",
      });
    }
  };

  const deleteTask = async (id: string) => {
    const found = tasks.find((t) => t.id === id);
    if (!found) return;

    setTasks((prev) => prev.filter((t) => t.id !== id));
    setTaskOrder((prev) => ({
      ...prev,
      [found.status]: (prev[found.status] || []).filter((tid) => tid !== id),
    }));

    try {
      await deleteTaskboardItem(projectId, id);
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  async function handleStatusPropertyChange(newPropertyId: string) {
    try {
      setStatusPropertyId(newPropertyId);

      await updateTaskboardStatusBinding(projectId, newPropertyId);

      const board = await getTaskboard(projectId);

      setBoardName(board.name);
      setStatusPropertyId(board.bindings?.statusPropertyId ?? newPropertyId);

      const apiCols = (board.columns ?? []) as any[];
      const mappedCols: Column[] = apiCols.map((c) => ({
        id: c.optionId ?? c.id,
        title: c.label ?? c.name ?? c.value ?? "Untitled Column",
      }));
      setCols(mappedCols);

      const apiCards = (board.cards ?? []) as any[];
      const mappedTasks: Task[] = apiCards.map((card) => ({
        id: card.id ?? card.documentId,
        title: card.title ?? "Untitled Task",
        description: card.description ?? "",
        status: card.columnId ?? card.optionId,
        assigneeIds: card.assigneeIds ?? [],
      }));
      setTasks(mappedTasks);
      setTaskOrder(buildInitialTaskOrder(mappedCols, mappedTasks));
    } catch (err) {
      console.error("Failed to change status property", err);
    }
  }

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

    let toCol = fromCol;
    if (overType === "column") toCol = String(over.id);
    else if (overType === "task") toCol = String(over.data.current?.columnId);

    if (!toCol || toCol === fromCol) return;

    setTaskOrder((prev) => {
      const next = { ...prev };
      next[fromCol] = (next[fromCol] || []).filter((id) => id !== activeTaskId);
      next[toCol] = [...(next[toCol] || []), activeTaskId];
      return next;
    });
    setTasks((prev) =>
      prev.map((t) => (t.id === activeTaskId ? { ...t, status: toCol } : t)),
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

      const newCols = arrayMove(cols, oldIndex, newIndex);
      setCols(newCols);

      if (statusPropertyId) {
        void reorderTaskboardColumns(
          projectId,
          statusPropertyId,
          newCols.map((c) => c.id),
        );
      }
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

      const fromArr = [...(taskOrder[fromCol] || [])];
      let toArr = fromCol === toCol ? fromArr : [...(taskOrder[toCol] || [])];

      const fromIndex = fromArr.indexOf(activeTaskId);
      if (fromIndex === -1) return;
      fromArr.splice(fromIndex, 1);

      if (overType === "task" && overTaskId) {
        const overIndex = toArr.indexOf(overTaskId);
        const insertAt = overIndex === -1 ? toArr.length : overIndex;
        toArr.splice(insertAt, 0, activeTaskId);
      } else {
        toArr.unshift(activeTaskId);
      }

      const nextOrder: TaskOrder = {
        ...taskOrder,
        [fromCol]: fromArr,
        [toCol]: toArr,
      };
      setTaskOrder(nextOrder);

      if (toCol !== fromCol) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeTaskId ? { ...t, status: toCol } : t,
          ),
        );
      }

      const newPos = nextOrder[toCol].indexOf(activeTaskId);
      if (statusPropertyId) {
        void updateTaskboardItem(projectId, activeTaskId, {
          optionId: toCol,
          position: newPos,
        });
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
      touchAction: "pan-y",
    } as React.CSSProperties;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={[
          "relative z-10 flex flex-col rounded-xl p-3 flex-shrink-0 bg-muted border border-border",
          "snap-start sm:snap-none",
          "w-[85vw] min-w-[260px] sm:w-80",
        ].join(" ")}
      >
        <div className="sticky top-0 z-10 -mx-3 mb-3 px-3 pt-1 pb-2 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/70 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                {...listeners}
                {...attributes}
                data-dnd-handle
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
                onChange={async (v) => {
                  const prevTitle = col.title;
                  const nextTitle = v || "Untitled Column";

                  setCols((prev) =>
                    prev.map((c) =>
                      c.id === col.id ? { ...c, title: nextTitle } : c,
                    ),
                  );

                  if (!statusPropertyId) return;

                  try {
                    await renameTaskboardColumn(
                      projectId,
                      statusPropertyId,
                      col.id,
                      nextTitle,
                    );
                  } catch (err) {
                    console.error("Failed to rename column", err);
                    setCols((prev) =>
                      prev.map((c) =>
                        c.id === col.id ? { ...c, title: prevTitle } : c,
                      ),
                    );
                  }
                }}
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
                      Delete {col.title || "Untitled Column"}?
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
        onClick={(e) => {
          const target = e.target as HTMLElement;

          if (
            target.closest("button") ||
            target.closest("[data-dnd-handle]") ||
            target.closest("[contenteditable='true']")
          ) {
            return;
          }

          openTask(task);
        }}
        className="border border-border bg-card text-card-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/5 cursor-pointer"
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                {...listeners}
                {...attributes}
                data-dnd-handle
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

          {/* UI kept identical to your board view. Uncomment if you want assignees visible.
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
          */}
        </CardContent>
      </Card>
    );
  }

  /* -------------------------------- render ------------------------------- */
  if (loadingBoard) {
    return (
      <div className="min-h-screen p-6 bg-background text-foreground">
        <div className="text-sm text-muted-foreground">Loading Task Board…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-background text-foreground">
      <div className="mb-4 sm:mb-6">
        <div className="mb-4 flex items-center gap-2 px-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Grouped by
          </span>

          <Select
            value={statusPropertyId ?? undefined}
            onValueChange={handleStatusPropertyChange}
          >
            <SelectTrigger className="h-8 w-56 text-sm">
              <SelectValue placeholder="No status property" />
            </SelectTrigger>
            <SelectContent>
              {statusProperties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <EditableText
          value={boardName}
          onChange={async (next) => {
            setBoardName(next);
            try {
              setSavingName(true);
              await updateTaskboardName(projectId, next || "Untitled Board");
            } catch (err) {
              console.error("Failed to update board name", err);
            } finally {
              setSavingName(false);
            }
          }}
          placeholder="Untitled Board"
          className="text-2xl sm:text-3xl font-bold px-2 py-2 truncate"
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
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

function makeUniqueColumnLabel(baseLabel: string, existingTitles: string[]) {
  let label = baseLabel;
  let counter = 1;
  while (existingTitles.includes(label)) {
    counter += 1;
    label = `${baseLabel} ${counter}`;
  }
  return label;
}
