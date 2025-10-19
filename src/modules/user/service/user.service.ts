import { userRepo } from "../repo/user.repo";
import { UpdateProfileInput } from "@/modules/user/dto/profile.dto";
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
  avatarUrl?: string | null; // optional
}) {
  let avatarUrl = args.avatarUrl ?? null;

  // If the caller didn’t pass it, fetch once from DB
  if (typeof args.avatarUrl === "undefined") {
    const u = await userRepo.findAvatarById(args.id); // select { avatarUrl: true }
    avatarUrl = u?.avatarUrl ?? null;
  }

  const displayName = `${args.firstName} ${args.lastName}`.trim();
  const initials =
    `${args.firstName?.[0] ?? ""}${args.lastName?.[0] ?? ""}`.toUpperCase() ||
    "U";
  const seed = hashSeed(`${args.id}:${args.email ?? ""}`);

  return {
    avatarUrl,
    displayName,
    initials,
    fallbackEmoji: EMOJIS[seed % EMOJIS.length],
    fallbackColor: COLORS[seed % COLORS.length],
  };
}
export const userService = {
  async updateAvatar(userId: string, avatarUrl: string | null) {
    const u = await userRepo.updateAvatar(userId, avatarUrl ?? null);
    return buildSidebarProfile({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
    });
  },
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    // normalize avatar if it was sent; "" -> null; undefined -> don't change
    const avatarSupplied = Object.prototype.hasOwnProperty.call(
      input,
      "avatarUrl"
    );
    const avatarUrl = avatarSupplied
      ? input.avatarUrl?.toString().trim() || null
      : undefined;

    const u = await userRepo.updateProfile(userId, {
      firstName,
      lastName,
      avatarUrl,
    });

    // IMPORTANT: pass avatarUrl into the builder
    return buildSidebarProfile({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      avatarUrl: u.avatarUrl ?? null,
    });
  },
};
