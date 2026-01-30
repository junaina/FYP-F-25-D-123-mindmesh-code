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
import { viewRegistry } from "./view-registry";

export type ViewKind =
  | "document"
  | "thread"
  | "meeting"
  | "taskboard"
  | "askmindy"
  | "discussions";
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
    const cfg = node.getConfig() as ViewConfig | undefined;

    if (!cfg) {
      return (
        <div className="p-3 text-sm text-red-500">
          This tab is missing its view config.
        </div>
      );
    }

    const Comp = viewRegistry[cfg.kind as keyof typeof viewRegistry];
    if (!Comp) {
      return (
        <div className="p-3 text-sm text-red-500">
          Unknown view kind: <code>{String(cfg.kind)}</code>
        </div>
      );
    }

    return <Comp id={cfg.id} params={cfg.params} />;
  }, []);

  // expose a simple global for now so Sidebar can start a drag
  (globalThis as any).openDeskDirect = openDirect;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).beginDeskDrag = (ev: DragEvent, payload: ViewConfig) => {
    // Start the UX of dragging…
    layoutRef.current?.addTabWithDragAndDrop(
      ev,
      {
        component: "view",
        name: payload.title,
        // (this config here is not reliably preserved by the callback)
        config: payload,
      } as IJsonTabNode,
      () => {
        // …then manually create the node with our real config
        const rootChildren = model.getRoot().getChildren();
        const fallbackTabsetId =
          rootChildren.length > 0
            ? (rootChildren[0] as unknown as { getId(): string }).getId()
            : "";
        const target = model.getActiveTabset()?.getId() ?? fallbackTabsetId;

        const nodeWithConfig: IJsonTabNode = {
          component: "view",
          name: payload.title,
          config: payload, // <-- critical
        };

        model.doAction(
          Actions.addNode(nodeWithConfig, target, DockLocation.CENTER, 0, true),
        );
        setModel(Model.fromJson(model.toJson()));
      },
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
      Actions.addNode(tabJson, target, DockLocation.CENTER, 0, true),
    );
    setModel(Model.fromJson(model.toJson()));
  }
  (globalThis as any).openDeskTab = openDirect;

  return (
    <div
      className="fixed top-0 right-0 bottom-0 z-0"
      style={{ left: "var(--sb-w, 72px)" }} // <-- respect sidebar width
    >
      <Layout ref={layoutRef} model={model} factory={factory} />
    </div>
  );
}
