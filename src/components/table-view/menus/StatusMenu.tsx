"use client";

export type StatusValue = "not_started" | "in_progress" | "done";

export const STATUS_META: Record<
  StatusValue,
  { label: string; colorClass: string }
> = {
  not_started: { label: "Not started", colorClass: "bg-gray-400" },
  in_progress: { label: "In progress", colorClass: "bg-blue-500" },
  done: { label: "Done", colorClass: "bg-green-500" },
};

export default function StatusMenu({
  value,
  onChange,
  onEdit,
}: {
  value: StatusValue | undefined;
  onChange: (v: StatusValue) => void;
  onEdit?: () => void;
}) {
  return (
    <div className="z-50 w-64 rounded-xl border border-gray-700 bg-[#1B1B1B] shadow-2xl overflow-hidden">
      {/* Current selection */}
      <div className="px-3 pt-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-gray-800/60 px-3 py-1 text-sm text-gray-200">
          <span className={`h-2 w-2 rounded-full ${value ? STATUS_META[value].colorClass : "bg-gray-500"}`} />
          {value ? STATUS_META[value].label : "Not started"}
        </div>
      </div>

      {/* Groups */}
      <div className="mt-3 pt-2">
        <Group title="To-do">
          <Item k="not_started" onPick={onChange} />
        </Group>
        <Divider />
        <Group title="In progress">
          <Item k="in_progress" onPick={onChange} />
        </Group>
        <Divider />
        <Group title="Complete">
          <Item k="done" onPick={onChange} />
        </Group>
      </div>

      <Divider />
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3 pb-2">
      <div className="px-1 pb-2 text-xs text-gray-400">{title}</div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="my-1 h-px bg-gray-700" />;
}

function Item({
  k,
  onPick,
}: {
  k: StatusValue;
  onPick: (v: StatusValue) => void;
}) {
  return (
    <button
      onClick={() => onPick(k)}
      className="mb-2 inline-flex items-center gap-2 rounded-full bg-gray-800/60 hover:bg-gray-700 px-3 py-1 text-sm text-gray-200"
    >
      <span className={`h-2 w-2 rounded-full ${STATUS_META[k].colorClass}`} />
      {STATUS_META[k].label}
    </button>
  );
}
