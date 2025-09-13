export type Assignee = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: string; // column id
  assigneeIds: string[];
};

export type Column = {
  id: string;
  title: string;
};

export type Board = {
  id: string;
  name: string;
};
