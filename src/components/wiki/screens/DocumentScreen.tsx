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
  /**
   * When true, the component behaves like a docked pane:
   * takes full height and scrolls inside.
   * When false (default), it behaves like a normal page section.
   */
  scrollInside?: boolean;
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
  scrollInside = false,
}: Props) {
  const [headerVersion, setHeaderVersion] = React.useState(0);
  const bumpHeader = React.useCallback(
    () => setHeaderVersion((v) => v + 1),
    []
  );

  const rootClasses = scrollInside
    ? "flex h-full min-h-0 flex-col" // old behavior for Desk
    : "flex flex-col"; // normal page

  const editorWrapperClasses = scrollInside
    ? "min-h-0 grow overflow-auto px-4 py-4"
    : "px-4 py-4";

  return (
    <div className={clsx(rootClasses, className)}>
      {/* Header */}
      <div className="border-b bg-background px-6 pb-4 pt-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <HeaderWrapper
              key={headerVersion}
              projectId={projectId}
              docId={docId}
              onChanged={bumpHeader}
            />
          </div>
          {headerRightSlot ? (
            <div className="ml-4">{headerRightSlot}</div>
          ) : null}
        </div>
      </div>

      {/* Editor */}
      <div className={editorWrapperClasses}>
        <EditorWrapper projectId={projectId} docId={docId} />
      </div>
    </div>
  );
}

export default DocumentScreen;
