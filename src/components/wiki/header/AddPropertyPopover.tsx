"use client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandItem,
  CommandList,
  CommandGroup,
} from "@/components/ui/command";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronsUpDown,
  ListChecks,
  CheckSquare,
  Hash,
  Calendar,
  AtSign,
  Link as LinkIcon,
  ToggleLeft,
  Tags,
  Users,
  Paperclip,
  Type as TextIcon,
} from "lucide-react";
import CreatePropertyForm from "@/components/wiki/header/CreatePropertyForm";
import * as React from "react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  docId: string;
  onCreated?: () => void;
};

type Step = "picker" | "form";
type PropertyKind =
  | "text"
  | "number"
  | "date_time"
  | "email"
  | "url"
  | "checkbox"
  | "select"
  | "multi_select"
  | "status"
  | "person"
  | "file";
const TYPES: Array<{
  kind: PropertyKind;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  group: "Basic" | "Choice" | "People & Files";
}> = [
  { kind: "text", label: "Text", Icon: TextIcon, group: "Basic" },
  { kind: "number", label: "Number", Icon: Hash, group: "Basic" },
  { kind: "date_time", label: "Date Time", Icon: Calendar, group: "Basic" },
  { kind: "email", label: "Email", Icon: AtSign, group: "Basic" },
  { kind: "url", label: "Url", Icon: LinkIcon, group: "Basic" },
  { kind: "checkbox", label: "Checkbox", Icon: ToggleLeft, group: "Basic" },

  { kind: "select", label: "Select", Icon: ListChecks, group: "Choice" },
  { kind: "multi_select", label: "Multi Select", Icon: Tags, group: "Choice" },
  { kind: "status", label: "Status", Icon: BadgeCheck, group: "Choice" },

  { kind: "person", label: "Person", Icon: Users, group: "People & Files" },
  { kind: "file", label: "File", Icon: Paperclip, group: "People & Files" },
];
export default function AddPropertyPopover({
  open,
  onOpenChange,
  projectId,
  docId,
  onCreated,
}: Props) {
  const [step, setStep] = React.useState<Step>("picker");
  const [kind, setKind] = React.useState<PropertyKind>("select");
  React.useEffect(() => {
    if (open) setStep("picker");
  }, [open]);
  const goForm = (k: PropertyKind) => {
    setKind(k);
    setStep("form");
  };
  const renderGroup = (title: (typeof TYPES)[number]["group"]) => (
    <CommandGroup key={title} heading={title}>
      {TYPES.filter((t) => t.group === title).map(({ kind, label, Icon }) => (
        <CommandItem
          key={kind}
          value={kind}
          onSelect={() => goForm(kind)}
          className="cursor-pointer"
        >
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </CommandItem>
      ))}
    </CommandGroup>
  );
  // the actual component
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {/* trigger is controlled by AddPropertyButton */}
      <PopoverTrigger asChild>
        <span className="sr-only" />
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0">
        {step === "picker" ? (
          <div className="p-2">
            <div className="px-2 py-1 text-xs text-muted-foreground">
              Add a property
            </div>
            <Command>
              <CommandList>
                {renderGroup("Basic")}
                {renderGroup("Choice")}
                {renderGroup("People & Files")}
              </CommandList>
            </Command>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            <div className="flex items-center text-sm">
              <button
                onClick={() => setStep("picker")}
                className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted"
                aria-label="Back"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-medium">Create property</span>
            </div>

            <CreatePropertyForm
              projectId={projectId}
              docId={docId}
              initialValue={kind} // ← pass exact selected type
              onCancel={() => onOpenChange(false)}
              onCreated={() => {
                onOpenChange(false);
                onCreated?.();
              }}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
