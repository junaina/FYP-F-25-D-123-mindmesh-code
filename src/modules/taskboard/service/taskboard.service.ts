import { projectRepo } from "@/modules/projects/repo/project.repo";
import {
  taskboardRepo,
  updateStatusBindingForTaskboardTx,
} from "../repo/taskboard.repo";
import {
  createTaskboardItemRepo,
  updateTaskboardItemRepo,
  deleteTaskboardItemRepo,
} from "../repo/taskboard.repo";
import { accessRepo } from "@/modules/documents/repo/access.repo";
import { prisma } from "@/lib/prisma";
import type {
  TaskboardDto,
  TaskboardStatusPropertiesResponseDto,
} from "../domain/taskboard.types";

type HttpError = Error & { status: number };

function httpError(status: number, msg: string): HttpError {
  const e = new Error(msg) as HttpError;
  e.status = status;
  return e;
}
function badRequest(msg: string) {
  return httpError(400, msg);
}
function conflict(msg: string) {
  return httpError(409, msg);
}

function forbidden(msg: string) {
  return httpError(403, msg);
}
function notFound(msg: string) {
  return httpError(404, msg);
}
async function getBoardIdAndAssertBinding(
  projectId: string,
  userId: string,
  propertyId: string,
) {
  const role = await projectRepo.getMemberRole(projectId, userId);
  if (!role) throw forbidden("You are not a member of this project");

  const ptr = await taskboardRepo.findPointerByProjectId(projectId);
  const boardId =
    ptr?.taskBoardId ??
    (await taskboardRepo.createDefaultForProject({
      projectId,
      createdById: userId,
    }));

  const board = await taskboardRepo.getBoardById(boardId);
  if (!board) throw notFound("Taskboard not found");

  const bound = board.bindings?.statusPropertyId ?? null;
  if (!bound) throw badRequest("Taskboard has no status binding");
  if (bound !== propertyId) {
    throw badRequest(
      "propertyId must match the taskboard's current status binding",
    );
  }

  return boardId;
}

export const taskboardService = {
  getOrCreateForProject: async (
    projectId: string,
    userId: string,
  ): Promise<TaskboardDto> => {
    const role = await projectRepo.getMemberRole(projectId, userId);
    if (!role) throw forbidden("You are not a member of this project");

    const ptr = await taskboardRepo.findPointerByProjectId(projectId);

    const boardId =
      ptr?.taskBoardId ??
      (await taskboardRepo.createDefaultForProject({
        projectId,
        createdById: userId,
      }));

    const board = await taskboardRepo.getBoardById(boardId);
    if (!board) throw notFound("Taskboard not found");

    return {
      id: board.id,
      name: board.name,
      bindings: {
        statusPropertyId: board.bindings?.statusPropertyId ?? null,
      },
      columns: (board.columns ?? []).map((c) => ({
        optionId: c.optionId,
        label: c.label ?? c.option?.value ?? "Untitled Column",
        value: c.label ?? c.option?.value ?? "Untitled Column",
        position: c.position ?? c.option?.position ?? null,
      })),
      cards: (board.items ?? []).map((it) => ({
        id: it.document.id,
        documentId: it.document.id,
        title: it.document.title ?? "Untitled Task",
        description: it.document.description ?? "",
        columnId: it.column?.optionId ?? null,
        optionId: it.column?.optionId ?? null,
        position: it.position ?? null,
        assigneeIds: [], // next usecase will wire this
      })),
    };
  },

  async getStatusPropertiesForProject(projectId: string) {
    const taskBoardId =
      await this.taskboardRepo.getTaskBoardIdForProject(projectId);
    if (!taskBoardId) return { properties: [], currentPropertyId: null };

    const bindings = await this.taskboardRepo.getBindings(taskBoardId);
    const currentPropertyId = bindings?.statusPropertyId ?? null;

    const properties =
      await this.taskboardRepo.listStatusPropertiesInTaskboardDocs(
        projectId,
        taskBoardId,
      );

    // Ensure the currently bound property is still selectable even if
    // none of the current docs has a value for it yet.
    if (
      currentPropertyId &&
      !properties.some((p) => p.id === currentPropertyId)
    ) {
      const bound = await this.taskboardRepo.getPropertyDefinitionById(
        projectId,
        currentPropertyId,
      );
      if (bound) properties.unshift(bound);
    }

    return { properties, currentPropertyId };
  },

  renameForProject: async (
    projectId: string,
    userId: string,
    name: string,
  ): Promise<{ ok: true }> => {
    const role = await projectRepo.getMemberRole(projectId, userId);
    if (!role) throw forbidden("You are not a member of this project");

    const ptr = await taskboardRepo.findPointerByProjectId(projectId);
    const boardId =
      ptr?.taskBoardId ??
      (await taskboardRepo.createDefaultForProject({
        projectId,
        createdById: userId,
      }));

    const nextName = (name || "").trim() || "Untitled Board";

    await taskboardRepo.updateBoardName(boardId, nextName);

    return { ok: true };
  },
  updateStatusBindingForProject: async (
    projectId: string,
    userId: string,
    statusPropertyId: string,
  ): Promise<{ ok: true }> => {
    const role = await projectRepo.getMemberRole(projectId, userId);
    if (!role) throw forbidden("You are not a member of this project");

    // ensure board exists
    const ptr = await taskboardRepo.findPointerByProjectId(projectId);
    const boardId =
      ptr?.taskBoardId ??
      (await taskboardRepo.createDefaultForProject({
        projectId,
        createdById: userId,
      }));

    // validate property belongs to this project + is status
    const prop = await taskboardRepo.getStatusPropertyForProject(
      projectId,
      statusPropertyId,
    );
    if (!prop) throw notFound("Status property not found");

    // eligibility: all current tasks must have a value for this property
    const docIds = await taskboardRepo.listTaskboardItemDocumentIds(boardId);
    if (docIds.length > 0) {
      const cnt = await taskboardRepo.countDocsWithStatusValue(docIds, prop.id);
      if (cnt !== docIds.length) {
        throw badRequest(
          "All tasks must have this status property set (with a value) before grouping by it.",
        );
      }
    }
    await prisma.$transaction(async (tx) => {
      await updateStatusBindingForTaskboardTx(tx, {
        taskBoardId: boardId,
        statusPropertyId,
      });
    });

    return { ok: true };
  },
  createColumnForProject: async (
    projectId: string,
    userId: string,
    propertyId: string,
    label: string,
  ) => {
    const boardId = await getBoardIdAndAssertBinding(
      projectId,
      userId,
      propertyId,
    );

    try {
      return await taskboardRepo.createColumnOptionForBoard({
        taskBoardId: boardId,
        propertyId,
        label,
      });
    } catch (err: any) {
      // Prisma unique constraint (same option value)
      if (err?.code === "P2002")
        throw conflict("A column with this name already exists");
      throw err;
    }
  },

  renameColumnForProject: async (
    projectId: string,
    userId: string,
    propertyId: string,
    optionId: string,
    label: string,
  ) => {
    const boardId = await getBoardIdAndAssertBinding(
      projectId,
      userId,
      propertyId,
    );

    try {
      await taskboardRepo.renameColumnOptionForBoard({
        taskBoardId: boardId,
        propertyId,
        optionId,
        label,
      });
      return { ok: true as const };
    } catch (err: any) {
      if (err?.code === "P2002")
        throw conflict("A column with this name already exists");
      throw err;
    }
  },

  deleteColumnForProject: async (
    projectId: string,
    userId: string,
    propertyId: string,
    optionId: string,
  ) => {
    const boardId = await getBoardIdAndAssertBinding(
      projectId,
      userId,
      propertyId,
    );
    await taskboardRepo.deleteColumnOptionHardForBoard({
      taskBoardId: boardId,
      propertyId,
      optionId,
    });
    return { ok: true as const };
  },

  reorderColumnsForProject: async (
    projectId: string,
    userId: string,
    propertyId: string,
    order: string[],
  ) => {
    const boardId = await getBoardIdAndAssertBinding(
      projectId,
      userId,
      propertyId,
    );
    await taskboardRepo.reorderColumnOptionsForBoard({
      taskBoardId: boardId,
      propertyId,
      order,
    });
    return { ok: true as const };
  },
  async createItemForProject(
    projectId: string,
    userId: string,
    input: { propertyId: string; optionId: string; title: string },
  ) {
    const ok = await accessRepo.isProjectMember(projectId, userId);
    if (!ok) throw forbidden("forbidden");

    return createTaskboardItemRepo(prisma, {
      projectId,
      userId,
      propertyId: input.propertyId,
      optionId: input.optionId,
      title: input.title,
    });
  },

  async updateItemForProject(
    projectId: string,
    userId: string,
    documentId: string,
    patch: any,
  ) {
    const ok = await accessRepo.isProjectMember(projectId, userId);
    if (!ok) throw forbidden("forbidden");

    return updateTaskboardItemRepo(prisma, {
      projectId,
      userId,
      documentId,
      patch,
    });
  },

  async deleteItemForProject(
    projectId: string,
    userId: string,
    documentId: string,
  ) {
    const ok = await accessRepo.isProjectMember(projectId, userId);
    if (!ok) throw forbidden("forbidden");

    return deleteTaskboardItemRepo(prisma, { projectId, userId, documentId });
  },
};
