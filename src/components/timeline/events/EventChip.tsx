"use client";
export default function EventChip({
  title,
  onClick,
  className,
}: {
  title: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={[
        // Base structure
        "flex w-full items-center gap-2 px-6 h-8 rounded-lg cursor-pointer select-none z-10",
        // Solid dark chip (uses theme vars)
        "bg-muted",
        "border border-muted-foreground/10",
        // Text and font
        "text-[color-mix(in_oklab,var(--foreground)_92%,white)] text-sm font-medium truncate",
        // Hover interaction
        "hover:bg-[color-mix(in_oklab,var(--card)_75%,black)] transition-colors duration-150",
        //Shadow
        "shadow-lg",
        className ?? "",
      ].join(" ")}
    >
      <span className="truncate">{title}</span>
    </div>
  );
}
