"use client";

import { Users, MessageSquareText } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type Person = { id: string; name: string; avatar?: string; muted?: boolean };

export default function RightToolbar({
  people = [],
}: {
  people?: Person[];
}) {
  const [tab, setTab] = useState<"people" | "chat">("people");

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between p-3">
        <div className="flex gap-2">
          <button
            className={`flex items-center gap-2 rounded-md px-3 py-1 text-sm ${
              tab === "people" ? "bg-secondary" : ""
            }`}
            onClick={() => setTab("people")}
          >
            <Users size={16} /> People
          </button>
          <button
            className={`flex items-center gap-2 rounded-md px-3 py-1 text-sm ${
              tab === "chat" ? "bg-secondary" : ""
            }`}
            onClick={() => setTab("chat")}
          >
            <MessageSquareText size={16} /> Chat
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-border" />

      {tab === "people" ? (
        <div className="flex flex-1 flex-col gap-3 overflow-auto p-3">
          {people.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-border p-2"
            >
              <div className="relative h-8 w-8 overflow-hidden rounded-full bg-secondary">
                {p.avatar ? (
                  <Image src={p.avatar} alt={p.name} fill className="object-cover" />
                ) : null}
              </div>
              <div className="text-sm">{p.name}</div>
              {p.muted && <span className="mm-chip mm-chip--gray">muted</span>}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-auto p-3 text-sm text-muted-foreground">
            Chat is UI-only for now.
          </div>
          <div className="border-t border-border p-3">
            <input
              placeholder="Send a message"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}
    </aside>
  );
}
