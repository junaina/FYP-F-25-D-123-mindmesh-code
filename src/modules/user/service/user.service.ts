import { userRepo } from "../repo/user.repo";

export type SidebarProfile = {
  avatarUrl: string | null;
  displayName: string;
  initials: string;
  fallbackEmoji: string;
  fallbackColor: string; // hex
};

// tiny deterministic hash
function hashSeed(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const EMOJIS = [
  "🧠",
  "📘",
  "✨",
  "🌈",
  "🧩",
  "🗂️",
  "📝",
  "📎",
  "🚀",
  "🔮",
  "🧭",
  "🗃️",
  "📐",
  "📊",
  "🧪",
  "💡",
  "🗓️",
  "🗒️",
  "🧱",
  "⚙️",
];
const COLORS = [
  "#0EA5E9",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#22C55E",
  "#06B6D4",
  "#F97316",
  "#84CC16",
];

// Build the UI-friendly profile using only inputs from the route
export async function buildSidebarProfile(args: {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
}): Promise<SidebarProfile> {
  const [avatar] = await Promise.all([userRepo.findAvatarById(args.id)]);

  const displayName = `${args.firstName} ${args.lastName}`.trim();
  const initials =
    `${args.firstName?.[0] ?? ""}${args.lastName?.[0] ?? ""}`.toUpperCase() ||
    "U";

  // seed is deterministic; does NOT leave the server
  const seed = hashSeed(`${args.id}:${args.email ?? ""}`);
  const fallbackEmoji = EMOJIS[seed % EMOJIS.length];
  const fallbackColor = COLORS[seed % COLORS.length];

  return {
    avatarUrl: avatar?.avatarUrl ?? null,
    displayName,
    initials,
    fallbackEmoji,
    fallbackColor,
  };
}
