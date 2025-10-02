"use client";

import React from "react";
import type { TableState } from "./types";
import { reducer, uid } from "./state";
import NameHeader from "./headers/NameHeader";
import PropertyHeader from "./headers/PropertyHeader";
import AddPropertyHeader from "./headers/AddPropertyHeader";
import AddPropertyMenu from "./menus/AddPropertyMenu";
import PropertiesPanel from "./PropertiesPanel";
import CellInput from "./cells/CellInput";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FileText, Table as TableIcon } from "lucide-react";

export default function Table() {
  const initial: TableState = {
    columns: [],
    rows: [
      { id: uid(), title: "", cells: {} },
      { id: uid(), title: "", cells: {} },
      { id: uid(), title: "", cells: {} },
    ],
  };

  const [state, dispatch] = React.useReducer(reducer, initial);

  const [panelOpen, setPanelOpen] = React.useState(false);
  const [addMenuOpen, setAddMenuOpen] = React.useState(false);
  const [addMenuAnchor, setAddMenuAnchor] = React.useState<{ x: number; y: number } | null>(null);

  const openAddMenu = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setAddMenuAnchor({ x: r.left, y: r.bottom + 6 });
    setAddMenuOpen(true);
  };

  const visibleCols = state.columns.filter(c => c.visible);

  /** ---- SCROLLABLE GRID SIZES ----
   * We use fixed px widths so the grid’s total width grows with columns.
   * The outer wrapper scrolls horizontally.
   */
  const NAME_W = 320;       // px
  const COL_W  = 240;       // px for every property column
  const ADD_W  = 56;        // px for the + / … column at the far right
  const totalWidth = NAME_W + visibleCols.length * COL_W + ADD_W;
  const template = `${NAME_W}px ${visibleCols.map(() => `${COL_W}px`).join(" ")} ${ADD_W}px`;

  return (
    <div className="min-h-screen bg-[#111] text-gray-100 p-6 font-[Inter,ui-sans-serif] text-[15.5px] md:text-[17px]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-full border border-gray-700 px-3 py-1 text-sm bg-[#151515] select-none flex items-center gap-2">
            <TableIcon className="h-4 w-4" /> Table
          </div>
        </div>

        {/* SCROLL CONTAINER (shadcn) */}
        <ScrollArea className="rounded-xl border border-gray-800">
          {/* Width shim so horizontal scroll appears when many columns */}
          <div style={{ minWidth: totalWidth }}>
            {/* HEADERS */}
            <div className="grid" style={{ gridTemplateColumns: template }}>
              <NameHeader onOpenPanel={() => setPanelOpen(true)} />
              {visibleCols.map(col => (
                <PropertyHeader
                  key={col.id}
                  column={col}
                  onRename={(id, name) => dispatch({ type: "RENAME_COLUMN", payload: { id, name } })}
                  onOpenPanel={() => setPanelOpen(true)}
                  onOpenAddMenu={openAddMenu}
                />
              ))}
              <AddPropertyHeader
                onOpenAddMenu={openAddMenu}
                onOpenPanel={() => setPanelOpen(true)}
                showPlus={visibleCols.length === 0}      // show + only when there are no columns
                showEllipsis={visibleCols.length > 0}    // show … only once columns exist
              />
            </div>

            {/* ROWS */}
            {state.rows.map(row => (
              <div
                key={row.id}
                className="grid border-b border-gray-900 hover:bg-[#141414] transition-colors"
                style={{ gridTemplateColumns: template }}
              >
                {/* Name cell */}
                <div className="px-2 py-1 flex items-center">
                  <FileText className="mx-2 h-4 w-4 text-gray-500" />
                  <input
                    className="w-full bg-transparent px-3 py-2 outline-none text-gray-200 placeholder-gray-500"
                    placeholder="New page"
                    value={row.title}
                    onChange={e =>
                      dispatch({
                        type: "UPDATE_CELL",
                        payload: { rowId: row.id, columnId: "title", value: e.target.value },
                      })
                    }
                  />
                </div>

                {/* Property cells */}
                {visibleCols.map(col => (
                  <div key={col.id} className="px-2 py-1">
                    <CellInput
                      type={col.type}
                      value={row.cells[col.id]}
                      onChange={v =>
                        dispatch({
                          type: "UPDATE_CELL",
                          payload: { rowId: row.id, columnId: col.id, value: v },
                        })
                      }
                    />
                  </div>
                ))}

                {/* trailing + column cell */}
                <div />
              </div>
            ))}

            {/* New row */}
            <div className="px-4 py-3">
              <button className="text-gray-400 hover:text-gray-200" onClick={() => dispatch({ type: "ADD_ROW" })}>
                + New page
              </button>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Add Property floating menu */}
        {addMenuOpen && addMenuAnchor && (
          <div
            className="fixed z-40"
            style={{ left: addMenuAnchor.x, top: addMenuAnchor.y }}
            onMouseLeave={() => setAddMenuOpen(false)}
          >
            <AddPropertyMenu
              onPick={type => {
                dispatch({ type: "ADD_COLUMN", payload: { type } });
                setAddMenuOpen(false);
              }}
            />
          </div>
        )}

        {/* Right panel */}
        <PropertiesPanel
          open={panelOpen}
          columns={[{ id: "__title__", name: "Name", type: "text", visible: true }, ...state.columns]}
          onToggle={id => {
            if (id === "__title__") return;
            dispatch({ type: "TOGGLE_COLUMN_VIS", payload: { id } });
          }}
          onClose={() => setPanelOpen(false)}
        />
      </div>
    </div>
  );
}
