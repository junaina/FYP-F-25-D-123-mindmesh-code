export interface CreateThreadDto {
  topic: string;
  description?: string;
  projectId: string;
  userId: string;
}