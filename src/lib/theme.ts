export type Theme = "light" | "dark" | "system";
export const THEME_COOKIE = "mm-theme";

export function resolveIsDark(initial: Theme, mqlDark: boolean) {
  if (initial === "dark") return true;
  if (initial === "light") return false;
  return mqlDark; // system
}
