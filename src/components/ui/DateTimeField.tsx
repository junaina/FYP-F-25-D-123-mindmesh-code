// components/forms/DateTimeField.tsx
"use client";

import * as React from "react";
import { format, setHours, setMinutes, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils"; // if you have a cn helper; otherwise inline classNames
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Props = {
  value?: string; // ISO
  onChange: (nextISO: string) => void;
  placeholder?: string;
  className?: string;
};

function ensureDate(v?: string) {
  if (!v) return new Date();
  const d = parseISO(v);
  return isValid(d) ? d : new Date();
}

export function DateTimeField({
  value,
  onChange,
  placeholder = "Pick date & time",
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const date = ensureDate(value);

  // hour/minute/ampm derived from date
  const h24 = date.getHours();
  const minute = date.getMinutes();
  const ampm = h24 >= 12 ? "PM" : "AM";
  const hour12 = ((h24 + 11) % 12) + 1; // 0..23 -> 1..12

  function commit(next: Date) {
    // return ISO string with minutes precision
    onChange(next.toISOString());
  }

  function setHour12(h: number, nextAMPM: "AM" | "PM" = ampm) {
    const to24 = (hh: number, ap: "AM" | "PM") => {
      let n = hh % 12;
      if (ap === "PM") n += 12;
      return n;
    };
    const d = setHours(date, to24(h, nextAMPM));
    commit(d);
  }

  function setMinute(m: number) {
    const d = setMinutes(date, m);
    commit(d);
  }

  function setAMPM(ap: "AM" | "PM") {
    setHour12(hour12, ap);
  }

  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[220px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value ? format(date, "PP · p") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div className="flex gap-4">
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (!d) return;
              // keep time; swap Y/M/D
              const withDay = new Date(d);
              withDay.setHours(date.getHours(), date.getMinutes(), 0, 0);
              commit(withDay);
            }}
            className="rounded-md border"
          />
          {/* Time selectors */}
          <div className="grid gap-3 content-start">
            <div className="text-sm font-medium text-muted-foreground">
              Time
            </div>

            <div className="flex gap-2">
              <Select
                value={String(hour12)}
                onValueChange={(v) => setHour12(parseInt(v, 10))}
              >
                <SelectTrigger className="w-[72px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours12.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {String(h).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(minute)}
                onValueChange={(v) => setMinute(parseInt(v, 10))}
              >
                <SelectTrigger className="w-[88px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {String(m).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={ampm}
                onValueChange={(v) => setAMPM(v as "AM" | "PM")}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Optional quick type-in (honors theme) */}
            <Input
              value={format(date, "yyyy-MM-dd HH:mm")}
              onChange={(e) => {
                // best-effort parse "YYYY-MM-DD HH:mm" to keep UI snappy
                const v = e.target.value;
                const match = v.match(
                  /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/
                );
                if (!match) return;
                const [_, Y, M, D, H, Min] = match;
                const d = new Date(
                  Number(Y),
                  Number(M) - 1,
                  Number(D),
                  Number(H),
                  Number(Min),
                  0,
                  0
                );
                if (isValid(d)) commit(d);
              }}
              className="w-[220px]"
            />

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => commit(new Date())}
              >
                Now
              </Button>
              <Button size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
