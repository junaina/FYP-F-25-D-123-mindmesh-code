// src/modules/document/DocumentScreen.tsx
"use client";

import * as React from "react";
import clsx from "clsx";

// Update these imports to match your actual paths:
import HeaderWrapper from "@/components/wiki/header/HeaderWrapper";
import EditorWrapper from "@/components/wiki/editor/EditorWrapper";

type Props = {
  projectId: string;
  docId: string;
  className?: string; // optional extra styling from host
  headerRightSlot?: React.ReactNode; // optional actions (share, etc.)
};

/**
 * Layout rules:
 * - outer: flex column that fills its parent (pane/tab)
 * - header: shrink-0 (doesn’t grow), border bottom
 * - content: grow + min-h-0 + overflow-auto so it scrolls INSIDE the pane
 */
export function DocumentScreen({
  projectId,
  docId,
  className,
  headerRightSlot,
}: Props) {
  return (
    <div className={clsx("flex h-full min-h-0 flex-col", className)}>
      {/* Header */}
      <div className="shrink-0 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <HeaderWrapper projectId={projectId} docId={docId} />
          {headerRightSlot ? (
            <div className="ml-4">{headerRightSlot}</div>
          ) : null}
        </div>
      </div>

      {/* Editor area (scrolls within the pane) */}
      <div className="min-h-0 grow overflow-auto px-4 py-4">
        <EditorWrapper projectId={projectId} docId={docId} />
      </div>
    </div>
  );
}

export default DocumentScreen;
