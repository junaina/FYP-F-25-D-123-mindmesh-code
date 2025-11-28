"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  backHref?: string;
};

export default function MindyUnderConstruction({
  title,
  subtitle = "Mindy is still wiring this up. Check back soon!",
  badge = "Under construction",
  backHref = "/home",
}: Props) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="relative max-w-2xl w-full overflow-hidden rounded-2xl border bg-gradient-to-b from-background via-background/80 to-background shadow-lg">
        {/* soft grid / glow background */}
        <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-soft-light">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(241,68,145,0.24),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(241,68,145,0.16),transparent_65%)]" />
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 md:p-10">
          {/* Mindy */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-6 rounded-full bg-accent/10 blur-2xl" />
              <Image
                src="/mindy-mascot/mindy-under-construction.png" // put the png here in /public/images
                alt="Mindy the mascot giving an OK sign"
                width={260}
                height={260}
                className="relative mm-mindy-bob drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Text + actions */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-dashed px-3 py-1 text-xs font-medium bg-muted/50 backdrop-blur">
              <span className="mm-pulse-dot h-2 w-2 rounded-full bg-accent" />
              <span className="uppercase tracking-wide text-muted-foreground">
                {badge}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {title}
            </h1>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <Link
                href={backHref}
                className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm hover:brightness-105 transition"
              >
                ← Back to Home
              </Link>
            </div>

            <p className="text-[11px] text-muted-foreground/80 pt-1">
              Tip: you can still use the rest of your project while Mindy
              finishes building this space.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
