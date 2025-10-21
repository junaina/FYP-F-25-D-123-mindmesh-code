"use client";
import { useEffect } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import dynamic from "next/dynamic";
const TableView = dynamic(() => import("@/components/table/TableView"), {
  ssr: false,
});

type Props = {
  projectId: string;
  docId: string;
  collectionId: string;
};

export default function TableViewNode({
  projectId,
  docId,
  collectionId,
}: Props) {
  useEffect(() => {
    console.log("[TableViewNode] mount", { projectId, docId, collectionId });
    return () => console.log("[TableViewNode] unmount", { collectionId });
  }, [projectId, docId, collectionId]);

  // Track dynamic import hydration
  useEffect(() => {
    if ((TableView as any)?.preload) {
      // Next.js dynamic doesn't expose onload, so we just log props
      console.log("[TableViewNode] TableView dynamic ready-ish", {
        collectionId,
      });
    }
  }, [collectionId]);

  return (
    <NodeViewWrapper as="div" className="my-4">
      <div className="w-full">
        <TableView
          projectId={projectId}
          docId={docId}
          collectionId={collectionId}
        />
      </div>
    </NodeViewWrapper>
  );
}
