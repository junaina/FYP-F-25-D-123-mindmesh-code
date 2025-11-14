// so i dont sprinkle process.env everywheres
export const DESK_ENABLED =
  (process.env.NEXT_PUBLIC_DESK_ENABLED ?? "").toLowerCase() === "true";
