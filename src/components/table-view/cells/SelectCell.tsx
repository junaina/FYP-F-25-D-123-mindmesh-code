"use client";

import * as React from "react";
import SelectMenu from "../menus/SelectMenu";
import Popover from "../ui/Popover";

export default function SelectCell({
  value,
  onChange,
  options = [],
  onCreateOption,
}: {
  value?: string;
  onChange: (v: string) => void;
  options?: string[];
  onCreateOption?: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [localOptions, setLocalOptions] = React.useState<string[]>(options);
  const btnRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => setLocalOptions(options), [options]);

  const add = (v: string) => {
    if (!localOptions.includes(v)) {
      setLocalOptions(p => [...p, v]);
      onCreateOption?.(v);
    }
  };

  return (
    <div>
      <button
        ref={btnRef}
        className={`min-w-[120px] rounded-md border border-gray-700 bg-transparent px-3 py-2 text-left text-sm ${
          value ? "text-gray-200" : "text-gray-500"
        } hover:bg-gray-800/60`}
        onClick={() => setOpen(v => !v)}
      >
        {value || "Select"}
      </button>

      <Popover anchorRef={btnRef} open={open} onClose={() => setOpen(false)} preferred="bottom-start">
        <div className="max-h-[70vh] overflow-auto">
          <SelectMenu
            options={localOptions}
            value={value}
            onChange={v => {
              onChange(v);
              setOpen(false);
            }}
            onCreate={v => add(v)}
          />
        </div>
      </Popover>
    </div>
  );
}
