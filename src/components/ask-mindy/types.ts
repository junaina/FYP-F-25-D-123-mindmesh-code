export type RagCitation = {
  sourceType: "DOCUMENT" | "MEETING" | string;
  sourceId: string;
  chunkIndex: number;
  distance: number;
  sourceTitle?: string;
  href?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  citations?: RagCitation[];
};

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
