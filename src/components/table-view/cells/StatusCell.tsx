"use client";

import * as React from "react";
import StatusMenu, { STATUS_META, StatusValue } from "../menus/StatusMenu";
import Popover from "../ui/Popover";

const isStatus = (v: any): v is StatusValue =>
  v === "not_started" || v === "in_progress" || v === "done";

export default function StatusCell({
  value,
  onChange,
}: {
  value: StatusValue | undefined;
  onChange: (v: StatusValue) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const current: StatusValue = isStatus(value) ? value : "not_started";

  return (
    <div>
      <button
        ref={btnRef}
        className="inline-flex items-center gap-2 rounded-full bg-gray-800/60 hover:bg-gray-700 px-3 py-1 text-sm text-gray-200"
        onClick={() => setOpen(v => !v)}
      >
        <span className={`h-2 w-2 rounded-full ${STATUS_META[current].colorClass}`} />
        {STATUS_META[current].label}
      </button>

      <Popover anchorRef={btnRef} open={open} onClose={() => setOpen(false)} preferred="bottom-start">
        {/* ensure menu can scroll if clamped to viewport */}
        <div className="max-h-[70vh] overflow-auto">
          <StatusMenu
            value={current}
            onChange={v => {
              onChange(v);
              setOpen(false);
            }}
            onEdit={() => setOpen(false)}
          />
        </div>
      </Popover>
    </div>
  );
}
