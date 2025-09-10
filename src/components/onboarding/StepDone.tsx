"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { StepBaseProps } from "./types";

type Props = StepBaseProps & {
  mascot: { src: string; alt: string };
  title: React.ReactNode;
  /** Plain text, always rendered inside a <p> */
  subtitle?: string;
  primaryLabel: string;
};

export default function StepDone({
  onNext,
  onBack,
  mascot,
  title,
  subtitle,
  primaryLabel,
}: Props) {
  return (
    <section className="h-screen w-full bg-black text-white overflow-hidden flex items-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-6xl mx-auto px-6 items-center">
        {/* LEFT: Mascot */}
        <div className="flex justify-center md:justify-start">
          <div className="relative w-full max-w-[560px] h-[520px] md:h-[600px]">
            <Image
              src={mascot.src}
              alt={mascot.alt}
              fill
              priority
              className="object-contain"
              sizes="(min-width: 768px) 40vw, 80vw"
            />
          </div>
        </div>

        {/* RIGHT: Text + Actions */}
        <div className="space-y-6 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-zinc-400 max-w-md mx-auto md:mx-0">{subtitle}</p>
          )}

          <div className="flex gap-2 justify-center md:justify-start">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button onClick={onNext}>{primaryLabel}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
