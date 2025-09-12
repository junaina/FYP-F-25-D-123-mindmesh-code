"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import StepIntro from "@/components/onboarding/StepIntro";
import StepProject from "@/components/onboarding/StepProject";
import StepInvite from "@/components/onboarding/StepInvite";
import StepDone from "@/components/onboarding/StepDone";
import StepDots from "@/components/onboarding/StepDots";
import type { StepConfig, StepId } from "@/components/onboarding/types";

const STEPS: StepConfig[] = [
  {
    id: 1,
    title: (
      <>
        <span className="text-accent">hey there</span>, let’s
        <br />
        get started!
      </>
    ),

    subtitle:
      "Productivity, simplified. All your project's info, tasks, and updates in one place.",
    mascot: {
      src: "/mindy-mascot/mindy-onboarding-hi.png",
      alt: "Mindy waving",
    },
  },
  {
    id: 2,
    title: (
      <>
        name your <span className="text-accent">first</span> project
      </>
    ),
    subtitle:
      "Keep docs and info organized. You can even ask Mindy using only the project’s content.",
    mascot: {
      src: "/mindy-mascot/mindy-onboarding-tablet.png",
      alt: "Mindy with checklist",
    },
  },
  {
    id: 3,
    title: (
      <>
        invite your <span className="text-accent">teammates</span>
      </>
    ),
    subtitle: "Share the project so everyone’s on the same page from day one.",
    mascot: {
      src: "/mindy-mascot/mindy-onboarding-invites.png",
      alt: "Mindy inviting",
    },
  },
  {
    id: 4,
    title: (
      <>
        you’re <span className="text-accent">all set</span>
      </>
    ),
    subtitle: "Let’s head to your team’s home screen to get started.",
    mascot: {
      src: "/mindy-mascot/mindy-all-set.png",
      alt: "Mindy All Set Sign",
    },
  },
];

const slide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>(1);
  const [projectName, setProjectName] = useState("");
  const [invitees, setInvitees] = useState<string[]>([]);

  //storing ob_step to localstorage
  useEffect(() => {
    const saved = localStorage.getItem("ob_step");
    if (saved) setStep(Number(saved) as StepId);
  }, []);
  useEffect(() => {
    localStorage.setItem("ob_step", String(step));
  }, [step]);

  // arrow key navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const current = useMemo(() => STEPS.find((s) => s.id === step)!, [step]);

  const next = () => setStep((s) => (s < 4 ? ((s + 1) as StepId) : s));
  const prev = () => setStep((s) => (s > 1 ? ((s - 1) as StepId) : s));
  const go = (id: StepId) => setStep(id);

  const finish = () => {
    // later: mark onboarding complete server-side
    router.replace("/app/home");
  };

  return (
    <div className="h-screen w-full bg-white text-black dark:bg-background dark:text-foreground overflow-hidden flex flex-col relative">
      <main className="flex-1 flex items-center">
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={slide.initial}
              animate={slide.animate}
              exit={slide.exit}
              className="w-full"
            >
              {step === 1 && (
                <StepIntro
                  onNext={next}
                  mascot={current.mascot}
                  title={current.title}
                  subtitle={current.subtitle}
                />
              )}

              {step === 2 && (
                <StepProject
                  onNext={next}
                  onBack={prev}
                  mascot={current.mascot}
                  title={current.title}
                  subtitle={current.subtitle}
                  initialValue={projectName}
                  onSubmitName={setProjectName}
                />
              )}

              {step === 3 && (
                <StepInvite
                  onNext={next}
                  onBack={prev}
                  onSkip={() => go(4)}
                  mascot={current.mascot}
                  title={current.title}
                  subtitle={current.subtitle}
                  initial={invitees}
                  onChange={setInvitees}
                />
              )}

              {step === 4 && (
                <StepDone
                  onNext={finish} // <-- finish here
                  onBack={prev}
                  mascot={current.mascot}
                  title={current.title}
                  subtitle={current.subtitle}
                  primaryLabel="Take Me Home"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <div className="relative inset-x-0 bottom-16 z-10 flex justify-center">
        <StepDots active={step} total={STEPS.length} onPick={go} />
      </div>
    </div>
  );
}
