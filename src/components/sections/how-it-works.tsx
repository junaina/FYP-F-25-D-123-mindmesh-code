// components/sections/how-it-works.tsx
"use client";

import { Inbox, Users, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import React from "react";

const steps = [
  {
    title: "Capture",
    desc: "Bring tasks, notes, wikis, and discussions into one place.",
    Icon: Inbox,
  },
  {
    title: "Collaborate",
    desc: "Discuss in threads, meet, and co-edit docs with your team.",
    Icon: Users,
  },
  {
    title: "Complete",
    desc: "Let AI summarize, surface action items, and unblock you.",
    Icon: CheckCircle2,
  },
];

// Duplicate items to create a seamless loop
const marqueeItems = [...steps, ...steps, ...steps];

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-2xl font-semibold">How it works</h2>

      {/* Slider viewport */}
      <div
        className="relative mt-8 overflow-hidden"
        // fade the edges (soft mask)
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)",
        }}
      >
        {/* Track */}
        <motion.div
          className="flex w-max gap-6"
          animate={{ x: ["0%", "-50%"] }} // move half width, since we tripled the content
          transition={{
            duration: 20, // adjust speed (larger = slower)
            ease: "linear",
            repeat: Infinity,
          }}
          aria-hidden // decorative animation
        >
          {marqueeItems.map(({ title, desc, Icon }, i) => (
            <article
              key={`${title}-${i}`}
              className={[
                "relative rounded-xl border bg-card p-6 shadow-sm",
                "min-w-[260px] max-w-[320px] sm:min-w-[280px] sm:max-w-[340px]",
              ].join(" ")}
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mx-auto text-sm text-muted-foreground">
                <div className="text-base font-semibold text-foreground">
                  {title}
                </div>
                <p className="mt-1">{desc}</p>
              </div>

              {/* subtle hover effect */}
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-0 transition-shadow hover:ring-2 hover:ring-[--accent]" />
            </article>
          ))}
        </motion.div>
      </div>

      {/* Accessible static list for screen readers (hidden visually) */}
      <ul className="sr-only">
        {steps.map((s) => (
          <li key={s.title}>
            <strong>{s.title}.</strong> {s.desc}
          </li>
        ))}
      </ul>
    </section>
  );
}
