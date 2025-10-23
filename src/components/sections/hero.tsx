"use client";

import { useEffect, useState, type ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookText, MessageSquare, Calendar, Brain } from "lucide-react";
import DeviceLaptop from "@/components/ui/device-laptop";

type SlideKey = "wikis" | "chat" | "meetings" | "mindy";

const slides: Record<
  SlideKey,
  { icon: ReactElement; title: string; bullets: string[]; mock: ReactElement }
> = {
  wikis: {
    icon: <BookText className="h-4 w-4 text-[--accent]" />,
    title: "Wikis & Knowledge Graph",
    bullets: ["Link pages", "Tag topics", "Lightning-fast search"],
    mock: (
      <div className="grid gap-2 p-4">
        <div className="h-4 w-1/2 rounded bg-[--accent]/70" />
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="h-16 rounded bg-[--accent]/20" />
          <div className="h-16 rounded bg-[--accent]/20" />
          <div className="col-span-2 h-24 rounded bg-[--accent]/10" />
        </div>
      </div>
    ),
  },
  chat: {
    icon: <MessageSquare className="h-4 w-4 text-[--accent]" />,
    title: "Discussions & Threads",
    bullets: ["Real-time chat", "Threaded replies", "Mentions & files"],
    mock: (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-black/5 bg-white p-3 shadow-sm ring-1 ring-black/5 dark:border-border dark:bg-card dark:shadow-none dark:ring-0"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-[--accent]/40" />
              <div className="h-3 w-24 rounded bg-[--accent]/60" />
            </div>
            <div className="h-2 w-3/4 rounded bg-zinc-200 dark:bg-muted" />
          </div>
        ))}
      </div>
    ),
  },
  meetings: {
    icon: <Calendar className="h-4 w-4 text-[--accent]" />,
    title: "Meetings & Action Items",
    bullets: ["Agenda → Notes", "Auto-organized", "Next steps in one place"],
    mock: (
      <div className="space-y-3 p-4">
        <div className="rounded-lg border border-black/5 bg-white p-3 shadow-sm ring-1 ring-black/5 dark:border-border dark:bg-card dark:shadow-none dark:ring-0">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-28 rounded bg-[--accent]" />
            <div className="h-3 w-14 rounded bg-zinc-200 dark:bg-muted" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-12 rounded bg-[--accent]/20" />
            <div className="h-12 rounded bg-[--accent]/20" />
            <div className="h-12 rounded bg-[--accent]/20" />
          </div>
        </div>
        <div className="rounded-lg border border-black/5 bg-white p-3 shadow-sm ring-1 ring-black/5 dark:border-border dark:bg-card dark:shadow-none dark:ring-0">
          <div className="mb-2 h-3 w-24 rounded bg-[--accent]/70" />
          <div className="h-2 w-3/4 rounded bg-zinc-200 dark:bg-muted" />
        </div>
      </div>
    ),
  },
  mindy: {
    icon: <Brain className="h-4 w-4 text-[--accent]" />,
    title: "AI Mindy",
    bullets: ["Summarize threads", "Draft docs", "Answer from your workspace"],
    mock: (
      <div className="space-y-4 p-4">
        <div className="rounded-lg border border-[--accent]/30 bg-[--accent]/5 p-3">
          <div className="mb-2 h-3 w-28 rounded bg-[--accent]" />
          <div className="h-2 w-3/4 rounded bg-[--accent]/40" />
        </div>
        <div className="rounded-lg border border-black/5 bg-white p-3 shadow-sm ring-1 ring-black/5 dark:border-border dark:bg-card dark:shadow-none dark:ring-0">
          <div className="mb-2 h-3 w-20 rounded bg-zinc-200 dark:bg-muted" />
          <div className="h-2 w-2/3 rounded bg-zinc-200 dark:bg-muted" />
        </div>
      </div>
    ),
  },
};

const wordsTop = ["the", "productivity", "app", "that"];
const wordsBottom = ["adapts", "to", "you."];

export default function Hero() {
  const [active, setActive] = useState<SlideKey>("wikis");

  useEffect(() => {
    const order: SlideKey[] = ["wikis", "chat", "meetings", "mindy"];
    const id = setInterval(() => {
      setActive((cur) => order[(order.indexOf(cur) + 1) % order.length]);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-background text-foreground">
      {/* subtle brand beams */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-20%] top-[-20%] h-[50rem] w-[50rem] rounded-full bg-[--accent]/10 blur-3xl" />
        <div className="absolute right-[-15%] bottom-[-20%] h-[40rem] w-[40rem] rounded-full bg-[--accent]/10 blur-3xl" />
      </div>

      {/* tighter top/bottom padding, wider container, smaller gap */}
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-4 pb-16 pt-16 md:grid-cols-2 md:pt-20">
        {/* Headline */}
        <div className="order-1 text-center md:order-none md:text-left">
          <div className="space-y-3">
            <motion.h1
              className="text-balance text-4xl font-bold leading-tight sm:text-5xl md:text-6xl"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06 } },
              }}
            >
              <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                {wordsTop.map((w, i) => (
                  <motion.span
                    key={i}
                    className={i === 1 ? "italic font-light" : "font-bold"}
                    variants={{
                      hidden: { y: -18, opacity: 0 },
                      show: {
                        y: 0,
                        opacity: 1,
                        transition: { duration: 0.45 },
                      },
                    }}
                  >
                    {w}
                  </motion.span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
                {wordsBottom.map((w, i) => (
                  <motion.span
                    key={i}
                    className={i === 2 ? "text-[--accent]" : "font-bold"}
                    variants={{
                      hidden: { y: -18, opacity: 0 },
                      show: {
                        y: 0,
                        opacity: 1,
                        transition: { duration: 0.45 },
                      },
                    }}
                  >
                    {w}
                  </motion.span>
                ))}
              </div>
            </motion.h1>

            <motion.p
              className="mx-auto max-w-xl text-muted-foreground md:mx-0"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.45 }}
            >
              Wikis, chat, meetings, and{" "}
              <span className="font-semibold text-[--accent]">AI Mindy</span>
              —together in one fast workspace.
            </motion.p>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              {(
                [
                  ["wikis", "Wikis"],
                  ["chat", "Chat"],
                  ["meetings", "Meetings"],
                  ["mindy", "AI Mindy"],
                ] as [SlideKey, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActive(key)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    active === key
                      ? "border-[--accent] bg-[--accent] text-[--accent-foreground]"
                      : "border-border text-foreground/80 hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview wrapped in laptop — nudged left on md+ */}
        <div className="relative md:-ml-12 lg:-ml-20 xl:-ml-28">
          {/* light-only soft background so white doesn't look empty */}
          <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-[radial-gradient(1100px_520px_at_70%_15%,_rgba(241,68,145,0.10),_transparent_60%)] md:block dark:hidden" />

          <DeviceLaptop label="MindMesh Preview">
            <div className="absolute inset-0 flex flex-col">
              {/* top bar inside screen */}
              <div className="flex items-center gap-2 border-b border-black/5 bg-white/70 px-4 py-2 backdrop-blur dark:border-border dark:bg-card/60">
                {slides[active].icon}
                <span className="text-sm font-medium">
                  {slides[active].title}
                </span>
              </div>

              {/* animated slide body */}
              <div className="relative flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    className="absolute inset-0"
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                    transition={{ duration: 0.35 }}
                  >
                    {slides[active].mock}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* feature bullets + progress */}
              <div className="border-t border-black/5 px-4 py-3 dark:border-border">
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  {slides[active].bullets.map((b, i) => (
                    <span key={i} className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[--accent]" />
                      {b}
                    </span>
                  ))}
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <motion.div
                    key={active}
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3.2, ease: "linear" }}
                    className="h-full bg-[--accent]"
                  />
                </div>
              </div>
            </div>
          </DeviceLaptop>
        </div>
      </div>
    </section>
  );
}
