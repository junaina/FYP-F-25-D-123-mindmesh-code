"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import DocHeader from "@/components/wiki/DocHeader";
import type { JSONContent } from "@tiptap/core";
import type { DocPropertyRow } from "@/modules/documents/domain/types";
import {
  fetchDocHeader,
  patchDocHeader,
  type DocHeaderAPI,
  type PatchPayload,
} from "@/modules/documents/client/docs.api";
import {
  apiPropsToUiRows,
  uiRowsToPatchObject,
} from "@/modules/documents/mappers/ui-property.mapper";

// lazy editor
const WikiEditor = dynamic(() => import("@/components/wiki/WikiEditor"), {
  ssr: false,
});

type Props = { docId: string };

export default function ClientDoc({ docId }: Props) {
  const [doc, setDoc] = useState<DocHeaderAPI | null>(null);
  const [rows, setRows] = useState<DocPropertyRow[]>([]);
  const [content, setContent] = useState<JSONContent | null>(null);

  // debounce PATCH
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  // keep the latest docId in a ref to avoid stale closures
  const docIdRef = useRef(docId);
  useEffect(() => {
    docIdRef.current = docId;
  }, [docId]);

  const debouncedPatch = (patch: PatchPayload) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const id = docIdRef.current;
      if (!id) return; // guard
      patchDocHeader(id, patch).catch(console.error);
    }, 450);
  };

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current); // clear on unmount
    },
    []
  );

  useEffect(() => {
    fetchDocHeader(docId)
      .then((data) => {
        setDoc(data);
        setRows(apiPropsToUiRows(data.properties));
      })
      .catch(console.error);
  }, [docId]);

  if (!doc) return null;

  return (
    <div className="space-y-6">
      <DocHeader
        docId={docId}
        title={doc.title}
        createdAt={doc.createdAt}
        description={doc.description ?? ""}
        properties={rows}
        onTitleChange={(title) => {
          setDoc((d) => (d ? { ...d, title } : d));
          debouncedPatch({ title });
        }}
        onDescriptionChange={(description) => {
          setDoc((d) => (d ? { ...d, description } : d));
          debouncedPatch({ description });
        }}
        onPropertiesChange={(nextRows) => {
          setRows(nextRows);
          const properties = uiRowsToPatchObject(nextRows);
          console.log("PATCH payload", properties);
          debouncedPatch({ properties });
        }}
      />

      <WikiEditor
        initialContent={content ?? { type: "doc", content: [] }}
        onChange={(json: JSONContent) => setContent(json)}
      />

      <div className="rounded-md border p-3 bg-muted/20">
        <div className="text-xs font-medium mb-2 opacity-70">Live state</div>
        <pre className="text-xs whitespace-pre-wrap">
          {JSON.stringify({ header: doc, properties: rows, content }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
