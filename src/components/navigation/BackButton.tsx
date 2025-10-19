// src/components/navigation/BackButton.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

type Props = {
  /** where to go if history/back isn't available */
  defaultHref?: string;
};

export default function BackButton({ defaultHref = "/home" }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from");

  function goBack() {
    // Prefer explicit "from" query, then browser history, then default
    if (from) {
      router.push(from);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(defaultHref);
    }
  }

  return (
    <Button variant="ghost" onClick={goBack} aria-label="Back">
      <ChevronLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
  );
}
