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
type PropertyKind = "select"; //will extend this later w select, multi-select, text, number, status and more

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

  // the actual component
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {/** will control the trigger from AddPropertyButton */}
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
                <CommandGroup heading="Types">
                  <CommandItem
                    value="select"
                    onSelect={() => {
                      setKind("select");
                      setStep("form");
                    }}
                    className="cursor-pointer"
                  >
                    <ListChecks className="mr-2 h-4 w-4" />
                    Select
                  </CommandItem>
                  {/*later will add more types here*/}
                </CommandGroup>
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
              initialValue={kind}
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
