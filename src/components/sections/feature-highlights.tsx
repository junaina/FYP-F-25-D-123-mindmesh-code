// components/sections/feature-highlights.tsx
"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

type RowProps = {
  id: string;
  heading: string;
  bullets: string[];
  flip?: boolean;
  image?: string; // path under /public
};

const listContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const listItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

function Row({ id, heading, bullets, flip, image }: RowProps) {
  // slide-in from left/right depending on flip
  const rowVariants: Variants = {
    hidden: { opacity: 0, y: 24, x: flip ? 24 : -24 },
    show: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        when: "beforeChildren",
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.98, rotateX: -5 },
    show: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: { type: "spring", stiffness: 160, damping: 18 },
    },
  };

  const imageStage: Variants = {
    hidden: { opacity: 0, scale: 0.98 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
  };

  return (
    <motion.div
      id={id}
      className={`mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2 ${
        flip ? "md:[&>*:first-child]:order-2" : ""
      }`}
      variants={rowVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3, margin: "-80px" }}
    >
      {/* copy */}
      <div>
        <h3 className="text-xl font-semibold">{heading}</h3>

        <motion.ul
          className="mt-4 space-y-2 text-sm"
          variants={listContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
        >
          {bullets.map((b) => (
            <motion.li key={b} className="flex items-start gap-2" variants={listItem}>
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-[--accent]" />
              <span className="text-muted-foreground">{b}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* visual card */}
      <motion.div
        className={[
          "rounded-xl border p-3 text-left outline-none transition-colors",
          "border-border bg-card/60 hover:border-[--accent] hover:bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]",
          "shadow-sm will-change-transform",
        ].join(" ")}
        variants={cardVariants}
        whileHover={{ y: -4, scale: 1.01 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 340, damping: 22 }}
      >
        <motion.div
          className={[
            "relative h-56 md:h-64 w-full overflow-hidden rounded-lg border border-border",
            "bg-gradient-to-br from-white to-muted/40 dark:from-neutral-900 dark:to-neutral-800",
          ].join(" ")}
          variants={imageStage}
        >
          {image ? (
            // padded layer so the image never touches the edges
            <div className="absolute inset-0 p-4">
              <Image
                src={image}
                alt={heading}
                fill
                sizes="(min-width: 768px) 560px, 100vw"
                className="object-contain"
                priority={id === "wikis"}
              />
            </div>
          ) : null}
          {/* gentle idle float for a bit of life */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function FeatureHighlights() {
  return (
    <section aria-labelledby="feature-highlights" className="py-6">
      <h2 id="feature-highlights" className="sr-only">
        Feature Highlights
      </h2>

      <Row
        id="wikis"
        heading="Wikis & Knowledge Organization"
        bullets={[
          "Link pages, tag topics, and map relationships.",
          "Lightning-fast search across docs and tasks.",
          "Keep project knowledge tidy and discoverable.",
        ]}
        image="/feature-highlights/wiki.jpg" // use a transparent PNG if possible
      />

      <Row
        id="discussions"
        heading="Discussions & Meetings"
        bullets={[
          "Threaded chat keeps context with the work.",
          "Meeting notes and recordings live side by side.",
          "Action items stay linked to tasks and owners.",
        ]}
        flip
        image="/feature-highlights/discussion.jpg"
      />

      <Row
        id="ai"
        heading="AI Copilot"
        bullets={[
          "Summarize threads and long documents instantly.",
          "Draft docs, PRDs, and stand-up notes in seconds.",
          "Ask questions across your entire workspace.",
        ]}
        image="/feature-highlights/mindyai.png"
      />
    </section>
  );
}
