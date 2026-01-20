export type TaskboardStatusOption = {
  id: string; // optionId (stable)
  value: string;
  color?: string | null;
  position?: number | null;
};

export type TaskboardColumn = {
  optionId: string; // same as status option id
  title: string;
  color?: string | null;
  position?: number | null;
};

export type TaskboardCard = {
  id: string; // documentId
  title: string;
  description?: string | null;
  columnOptionId: string | null; // status option id
  position?: number | null;
  assigneeIds: string[];
};

export type TaskboardDto = {
  id: string;
  projectId: string;
  name: string;

  statusProperty: {
    id: string;
    name: string;
    options: TaskboardStatusOption[];
  };

  columns: TaskboardColumn[];
  cards: TaskboardCard[];
};
