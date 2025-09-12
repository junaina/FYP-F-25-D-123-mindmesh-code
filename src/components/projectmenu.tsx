"use client";

import { useState } from "react";
import { MoreVertical, Users, Trash2, Bell } from "lucide-react";
import { Dialog } from "@headlessui/react";
import InviteDialog from "./invite-dialog";

export default function ProjectMenu() {
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="relative">
      {/* 3-dots button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-muted"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-background shadow-lg border p-2 space-y-2 z-50">
          <button
            onClick={() => alert("Notifications toggled!")}
            className="flex items-center gap-2 w-full px-2 py-1 text-sm rounded hover:bg-muted"
          >
            <Bell className="h-4 w-4" /> Notify Me
          </button>

          <button
            onClick={() => {
              setInviteOpen(true);
              setOpen(false);
            }}
            className="flex items-center gap-2 w-full px-2 py-1 text-sm rounded hover:bg-muted"
          >
            <Users className="h-4 w-4" /> Invite People
          </button>

          <button
            onClick={() => alert("Project deleted!")}
            className="flex items-center gap-2 w-full px-2 py-1 text-sm rounded text-red-500 hover:bg-muted"
          >
            <Trash2 className="h-4 w-4" /> Delete Project
          </button>
        </div>
      )}

      {/* Invite dialog */}
      <InviteDialog open={inviteOpen} setOpen={setInviteOpen} />
    </div>
  );
}
