// DTO used by API responses

import type { ApiProp } from "@/modules/documents/domain/types";

export type DocHeaderDTO = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  properties: Record<string, ApiProp>;
};
