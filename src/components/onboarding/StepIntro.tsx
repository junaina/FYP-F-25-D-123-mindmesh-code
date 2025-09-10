"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type Props = {
  onNext: () => void;
  mascot: { src: string; alt: string };
  title: ReactNode; // rich heading (can include <span> etc.)
  subtitle?: string; // plain text; rendered inside a <p>
};

export default function StepIntro({ onNext, mascot, title, subtitle }: Props) {
  return (
    <section className="h-screen w-full bg-black text-white overflow-hidden flex items-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-6xl mx-auto px-6 items-center">
        {/* LEFT: Mindy */}
        <div className="flex justify-center md:justify-start">
          <div className="relative w-full max-w-[520px] aspect-square">
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

        {/* RIGHT: Text + CTA */}
        <div className="space-y-6 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-zinc-400 max-w-md mx-auto md:mx-0">{subtitle}</p>
          )}
          <Button onClick={onNext} variant="outline" className="px-5 py-2">
            Let’s Go
          </Button>
        </div>
      </div>
    </section>
  );
}
