// src/components/wiki/ui/chip-colors.ts
export type ChipColor =
  | "gray"
  | "pink"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "indigo"
  | "violet"
  | "purple";

export const CHIP_COLORS: ChipColor[] = [
  "gray",
  "pink",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "indigo",
  "violet",
  "purple",
];

export function chipClasses(
  color?: ChipColor,
  rounded: boolean = true,
  extra?: string
) {
  const tone = `mm-chip--${color ?? "gray"}`; // uses theme CSS vars from globals.css
  const shape = rounded ? "rounded-md" : "rounded-sm";
  return `mm-chip ${shape} ${tone}${extra ? ` ${extra}` : ""}`;
}
