// src/app/sidebar-demo/page.tsx
"use client";

import Sidebar from "@/components/sidebar/SidebarWrapper";

export default function SidebarDemoPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-semibold">Sidebar Demo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Click items in the sidebar and watch the browser console for logs.
          This page is intentionally minimal so you can focus on the sidebar UX.
        </p>

        <div className="mt-6 rounded-xl border p-4">
          <p>
            You can replace this area with your actual page content later (Home,
            Inbox, Search, Project dashboards, etc.). For now, this is just a
            placeholder so you can see the layout next to the sidebar.
          </p>
        </div>
      </main>
    </div>
  );
}
