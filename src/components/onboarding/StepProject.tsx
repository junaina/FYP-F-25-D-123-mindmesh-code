"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepBaseProps } from "./types";

type Props = StepBaseProps & {
  mascot: { src: string; alt: string };
  title: ReactNode;
  subtitle?: string; // plain text, consistent with StepIntro
  initialValue?: string;
  onSubmitName: (name: string) => void;
};

export default function StepProject({
  onNext,
  onBack,
  mascot,
  title,
  subtitle,
  initialValue = "",
  onSubmitName,
}: Props) {
  const [name, setName] = useState(initialValue);
  const trimmed = name.trim();
  const isValid = trimmed.length >= 2;

  const submit = () => {
    if (!isValid) return;
    onSubmitName(trimmed);
    onNext();
  };

  return (
    <section className="h-screen w-full bg-black text-white overflow-hidden flex items-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-6xl mx-auto px-6 items-center">
        {/* LEFT: mascot */}
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

        {/* RIGHT: form */}
        <div className="space-y-6 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-zinc-400 max-w-md mx-auto md:mx-0">{subtitle}</p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="space-y-3 max-w-md mx-auto md:mx-0"
          >
            <Label htmlFor="project-name" className="text-zinc-300">
              Project name
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project Name"
            />
            <div className="flex gap-2 pt-2">
              {onBack && (
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
              )}
              <Button type="submit" disabled={!isValid}>
                Next
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
