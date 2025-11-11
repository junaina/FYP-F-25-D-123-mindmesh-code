// src/components/desk/Desk.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import {
  Layout,
  Model,
  TabNode,
  Actions,
  DockLocation,
  type IJsonModel,
  type IJsonTabNode,
  type IJsonTabSetNode,
} from "flexlayout-react";
import "flexlayout-react/style/dark.css";
import { viewRegistry } from "./view-registry";

export type ViewKind = "document" | "thread" | "meeting" | "taskboard";
export type ViewConfig = {
  kind: ViewKind;
  id: string;
  title: string;
  params: { projectId: string; [k: string]: unknown };
};

// Strictly type the model JSON:
const DEFAULT_JSON: IJsonModel = {
  // `global` is optional; leaving it empty avoids strict key errors
  global: {},
  borders: [],
  layout: {
    type: "row",
    children: [
      {
        type: "tabset",
        weight: 50,
        children: [],
        // If you want floating enabled for tabs in this tabset:
        // tabEnableFloat: true,
      } as IJsonTabSetNode,
    ],
  },
};

export default function Desk() {
  const layoutRef = useRef<Layout>(null);
  const [model, setModel] = useState(() => Model.fromJson(DEFAULT_JSON));

  const factory = useCallback((node: TabNode) => {
    const cfg = node.getConfig() as ViewConfig;
    const Comp = viewRegistry[cfg.kind];
    return <Comp id={cfg.id} params={cfg.params} />;
  }, []);

  // expose a simple global for now so Sidebar can start a drag
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).beginDeskDrag = (ev: DragEvent, payload: ViewConfig) => {
    layoutRef.current?.addTabWithDragAndDrop(
      ev, // ← pass the DOM Drag/Mouse event here
      {
        component: "view",
        name: payload.title,
        config: payload,
      } as IJsonTabNode,
      (tabJson) => {
        const rootChildren = model.getRoot().getChildren();
        const fallbackTabsetId =
          rootChildren.length > 0
            ? (rootChildren[0] as unknown as { getId(): string }).getId()
            : "";
        const target = model.getActiveTabset()?.getId() ?? fallbackTabsetId;

        model.doAction(
          Actions.addNode(tabJson, target, DockLocation.CENTER, 0, true)
        );
        setModel(Model.fromJson(model.toJson()));
      }
    );
  };
  // inside Desk() above the return
  function openDirect(payload: ViewConfig) {
    const tabJson: IJsonTabNode = {
      component: "view",
      name: payload.title,
      config: payload,
    };

    const rootChildren = model.getRoot().getChildren();
    const fallbackTabsetId =
      rootChildren.length > 0
        ? (rootChildren[0] as unknown as { getId(): string }).getId()
        : "";

    const target = model.getActiveTabset()?.getId() ?? fallbackTabsetId;

    model.doAction(
      Actions.addNode(tabJson, target, DockLocation.CENTER, 0, true)
    );
    setModel(Model.fromJson(model.toJson()));
  }

  return (
    <div className="flex h-full">
      <div className="absolute left-4 top-4 z-10">
        <button
          className="rounded border px-2 py-1 text-sm"
          onClick={() =>
            openDirect({
              kind: "document",
              id: "<REAL_DOC_ID>",
              title: "Sample Doc",
              params: { projectId: "<REAL_PROJECT_ID>" },
            })
          }
        >
          Open directly
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <Layout ref={layoutRef} model={model} factory={factory} />
      </div>
    </div>
  );
}
