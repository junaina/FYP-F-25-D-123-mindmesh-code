"use client";

import React from "react";
import {
  CalendarData,
  CalendarItem,
  ID,
  PropertyValue,
} from "@/types/calendar";

import PropertyEditors from "@/components/calendar/PropertyEditors";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type Props = {
  open: boolean;
  item: CalendarItem | null;
  onClose: () => void;
  onSave: (item: CalendarItem) => void;
  onDelete: (id: ID) => void;
  data: CalendarData;
};

export default function ItemSheet({
  open,
  item,
  onClose,
  onSave,
  onDelete,
  data,
}: Props) {
  const [draft, setDraft] = React.useState<CalendarItem | null>(item);

  React.useEffect(() => {
    setDraft(item);
  }, [item]);

  const setProp = (schemaId: ID, value: PropertyValue) => {
    if (!draft) return;
    setDraft({
      ...draft,
      properties: {
        ...draft.properties,
        [schemaId]: value,
      },
    });
  };

  const handleSave = () => {
    if (!draft) return;
    onSave(draft);
  };

  const handleDelete = () => {
    if (!draft) return;
    onDelete(draft.id);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <SheetContent side="right" className="w-[520px] sm:w-[640px]">
        {draft && (
          <>
            <SheetHeader>
              <SheetTitle>
                <Input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  className="h-10 border-none px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
                  aria-label="Title"
                />
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="mt-4 h-[calc(100vh-10rem)] pr-2">
              <div className="grid grid-cols-1 gap-6">
                {/* Properties */}
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Properties
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {data.propertySchemas.map((schema) => (
                      <PropertyEditors
                        key={schema.id}
                        schema={schema}
                        people={data.people}
                        value={draft.properties[schema.id]}
                        onChange={(val) => setProp(schema.id, val)}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Description
                  </h3>
                  <Textarea
                    value={draft.description ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                    placeholder="Write notes like a wiki…"
                    className="min-h-[180px]"
                  />
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="mt-4 flex items-center justify-between">
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
              <div className="space-x-2">
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
