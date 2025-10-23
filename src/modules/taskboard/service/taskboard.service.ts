import { TaskboardRepo } from "../repo/taskboard.repo";
import {
  BoardSummary,
  CardDTO,
  ColumnDTO,
  TaskBoardSnapshot,
} from "@/modules/board/domain/types";

import { HttpError } from "@/lib/https";

export const TaskboardService = {
  async listSummaries(projectId: string): Promise<BoardSummary[]> {
    const rows = await TaskboardRepo.listByProject(projectId);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  },
  async getBoard(
    projectId: string,
    taskBoardId: string
  ): Promise<TaskBoardSnapshot> {
    const b = await TaskboardRepo.getSnapshot(projectId, taskBoardId);
    if (!b || !b.bindings)
      throw new HttpError(404, "NOT_FOUND", "Task boardnot found");
    const columns: ColumnDTO[] = b.columns.map((c) => ({
      id: c.id,
      label: c.label,
      position: c.position,
      optionId: c.optionId,
    }));
    const cards: CardDTO[] = b.items.map((it) => ({
      id: `${b.id}:${it.documentId}`,
      documentId: it.documentId,
      title: it.document.title,
      description: it.document.description,
      columnId: it.columnId,
      position: it.position,
    }));
    return {
      id: b.id,
      name: b.name,
      description: null,
      bindings: { statusPropertyId: b.bindings.statusPropertyId },
      columns,
      cards,
    };
  },
};
