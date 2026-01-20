import { TaskboardDto } from "@/modules/taskboard/domain/taskboard.types";

export function getTaskboardMock(projectId: string): TaskboardDto {
  const options = [
    { id: "opt_backlog", value: "Backlog", color: "slate", position: 1 },
    { id: "opt_progress", value: "In Progress", color: "blue", position: 2 },
    { id: "opt_done", value: "Done", color: "green", position: 3 },
  ];

  const columns = options.map((o) => ({
    optionId: o.id,
    title: o.value,
    color: o.color,
    position: o.position,
  }));

  return {
    id: "tb_mock_1",
    projectId,
    name: "Task Board",
    statusProperty: {
      id: "prop_status",
      name: "Status",
      options,
    },
    columns,
    cards: [
      {
        id: "doc_1",
        title: "Setup CI pipeline",
        description: "Add lint/typecheck in GitHub Actions",
        columnOptionId: "opt_backlog",
        position: 1,
        assigneeIds: [],
      },
      {
        id: "doc_2",
        title: "Task board UI skeleton",
        description: "Build Task Board page + kanban",
        columnOptionId: "opt_progress",
        position: 1,
        assigneeIds: [],
      },
      {
        id: "doc_3",
        title: "Ship v1",
        description: "Create/move tasks + persist later",
        columnOptionId: "opt_done",
        position: 1,
        assigneeIds: [],
      },
    ],
  };
}
