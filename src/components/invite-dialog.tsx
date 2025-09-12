"use client";

import { Dialog } from "@headlessui/react";

export default function InviteDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
}) {
  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Invite People
          </Dialog.Title>

          <input
            type="email"
            placeholder="Enter email address"
            className="w-full p-2 border rounded mb-4 bg-muted"
          />

          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 text-sm bg-muted rounded"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm bg-pink-600 text-white rounded"
              onClick={() => {
                alert("Invitation sent!");
                setOpen(false);
              }}
            >
              Send Invite
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
