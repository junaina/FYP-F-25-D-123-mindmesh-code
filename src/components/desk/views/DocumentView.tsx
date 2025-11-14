// src/components/desk/views/DocumentView.tsx
"use client";

import * as React from "react";
import { DocumentScreen } from "@/components/wiki/screens/DocumentScreen";

type Props = {
  id: string; // docId (from ViewConfig.id)
  params: { projectId: string }; // from ViewConfig.params
  className?: string; // optional: desk can pass extra styles
};

export default function DocumentView({ id, params, className }: Props) {
  // Defensive guard if something calls it without projectId
  if (!params?.projectId) {
    return (
      <div className="p-4 text-sm text-red-500">
        Missing <code>projectId</code> for DocumentView.
      </div>
    );
  }

  return (
    <DocumentScreen
      projectId={params.projectId}
      docId={id}
      className={className}
      // headerRightSlot={...} // optional: pass desk-specific actions if you add them later
    />
  );
}
