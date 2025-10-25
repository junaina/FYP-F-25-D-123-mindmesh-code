import { userRepo } from "../repo/user.repo";
import { UpdateProfileInput } from "@/modules/user/dto/profile.dto";
import { ChangePasswordInput } from "@/modules/user/dto/password.dto";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import * as SessionRepo from "@/modules/auth/repo/session.repo";
export type SidebarProfile = {
  avatarUrl: string | null;
  displayName: string;
  initials: string;
  fallbackEmoji: string;
  fallbackColor: string; // hex
};

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

export async function buildSidebarProfile(args: {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  avatarUrl?: string | null; // optional
}) {
  let avatarUrl = args.avatarUrl ?? null;

  if (typeof args.avatarUrl === "undefined") {
    const u = await userRepo.findAvatarById(args.id); 
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

    return buildSidebarProfile({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      avatarUrl: u.avatarUrl ?? null,
    });
  },
};
export async function changePassword(
  userId: string,
  input: ChangePasswordInput
) {
  const rec = await userRepo.getPasswordHash(userId);

  if (!rec?.passwordHash) {
    throw new Error("No password set for this account");
  }

  const ok = await verifyPassword(input.currentPassword, rec.passwordHash);
  if (!ok) {
    throw new Error("Current password is incorrect");
  }

  const newHash = await hashPassword(input.newPassword);
  await userRepo.updatePasswordHash(userId, newHash);
  return { success: true };
}
export async function deleteAccount(userId: string) {
  const owned = await userRepo.countProjectsCreatedBy(userId);
  if (owned > 0) {
    const err: any = new Error(
      "You still own projects. Please delete or transfer them before deleting your account."
    );
    err.status = 409;
    throw err;
  }

  await SessionRepo.revokeAllSessionsDB(userId);

  try {
    await userRepo.deleteUserHard(userId);
  } catch (e: any) {
    const err: any = new Error(
      "Your account cannot be deleted because other data still references it."
    );
    err.status = 409;
    throw err;
  }
}
