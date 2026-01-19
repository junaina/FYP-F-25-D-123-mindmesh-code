export type ThreadListItem = {
  id: string;
  topic: string;
  description?: string | null;
  createdAt: string;
  lastMessageAt?: string | null;
  unreadCount?: number;
  memberCount?: number;
  isMuted?: boolean;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
};

export type MessageDTO = {
  id: string;
  body: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  attachments: { id: string; filename: string }[];
  reactions: { emoji: string; count: number; reactedByMe: boolean }[];
  mentions?: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string | null;
    };
  }[];
};
