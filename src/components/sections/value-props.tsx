// components/sections/value-props.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookText, MessageCircle, Sparkles } from "lucide-react";

const items = [
  {
    title: "Centralize knowledge",
    desc: "Wikis and a lightweight knowledge graph keep everything connected.",
    Icon: BookText,
  },
  {
    title: "Talk it out",
    desc: "Threaded chat and online meetings—right where your work lives.",
    Icon: MessageCircle,
  },
  {
    title: "Work faster with AI",
    desc: "Ask AI for summaries, answers, and next steps—across your workspace.",
    Icon: Sparkles,
  },
];

export default function ValueProps() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-2xl font-semibold">Why MindMesh</h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ title, desc, Icon }, i) => {
          const isActive = active === i;

          return (
            <motion.article
              key={title}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              onClick={() => setActive(isActive ? null : i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActive(isActive ? null : i);
                }
              }}
              className={[
                "rounded-xl border p-5 shadow-sm outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-[--accent] focus-visible:ring-offset-2",
                isActive
                  ? "border-[--accent] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]"
                  : "border-border bg-card hover:bg-accent/50",
              ].join(" ")}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 360, damping: 22 }}
              animate={
                isActive
                  ? {
                      boxShadow:
                        "0 0 18px 0 color-mix(in oklab, var(--accent) 45%, transparent)",
                    }
                  : { boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
              }
            >
              <div
                className={[
                  "mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg",
                  isActive
                    ? "bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-[--accent]"
                    : "bg-muted",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
5