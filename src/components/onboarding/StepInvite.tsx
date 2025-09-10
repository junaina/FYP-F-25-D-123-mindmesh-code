"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StepBaseProps } from "./types";

// allow simple emails like a@b.co (not production-grade, just UX-friendly)
const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v);

type Props = StepBaseProps & {
  mascot: { src: string; alt: string };
  title: ReactNode;
  /** Plain text; rendered in a <p> */
  subtitle?: string;
  initial?: string[];
  onChange?: (emails: string[]) => void;
  onSkip?: () => void;
};

export default function StepInvite({
  onNext,
  onBack,
  onSkip,
  mascot,
  title,
  subtitle,
  initial = [],
  onChange,
}: Props) {
  const [emails, setEmails] = useState<string[]>(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v || !isEmail(v) || emails.includes(v)) return;
    const next = [...emails, v];
    setEmails(next);
    onChange?.(next);
  };

  const remove = (email: string) => {
    const next = emails.filter((e) => e !== email);
    setEmails(next);
    onChange?.(next);
  };

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

        {/* RIGHT: Content */}
        <div className="space-y-6 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-zinc-400 max-w-md mx-auto md:mx-0">{subtitle}</p>
          )}

          <div className="space-y-3 max-w-md mx-auto md:mx-0">
            <Label className="text-zinc-300">Teammates (email)</Label>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="jane@company.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    add((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
                onBlur={(e) => {
                  add(e.currentTarget.value);
                  e.currentTarget.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const v = inputRef.current?.value || "";
                  add(v);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                Invite
              </Button>
            </div>

            {!!emails.length && (
              <div className="flex flex-wrap gap-2 pt-2">
                {emails.map((e) => (
                  <span
                    key={e}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1 text-xs"
                  >
                    {e}
                    <button
                      onClick={() => remove(e)}
                      className="text-zinc-400 hover:text-white"
                      aria-label={`Remove ${e}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              {onBack && (
                <Button variant="ghost" onClick={onBack}>
                  Back
                </Button>
              )}
              <Button variant="outline" onClick={onNext}>
                Next
              </Button>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="text-xs text-zinc-400 underline underline-offset-4 ml-2"
                >
                  Skip for now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
