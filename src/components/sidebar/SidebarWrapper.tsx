// src/components/sidebar/Sidebar.tsx
"use client";

import { useState } from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarItem from "./SidebarItem";
import SidebarProjects from "./SidebarProjects";
import { Mail, Search, Home, Trash } from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const handleAction = (action: string) => {
    console.log(`Action triggered: ${action}`);
  };

  return (
    <div
      className={`h-screen bg-background border-r flex flex-col ${
        collapsed ? "w-20" : "w-64"
      } transition-all`}
    >
      <SidebarHeader
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />

      <div className="flex-1 overflow-y-auto">
        <SidebarItem
          icon={<Home className="w-4 h-4" />}
          label="Home"
          collapsed={collapsed}
          onClick={() => handleAction("Home")}
        />
        <SidebarItem
          icon={<Search className="w-4 h-4" />}
          label="Search"
          collapsed={collapsed}
          onClick={() => handleAction("Search")}
        />
        <SidebarItem
          icon={<Mail className="w-4 h-4" />}
          label="Inbox"
          collapsed={collapsed}
          onClick={() => handleAction("Inbox")}
        />

        <SidebarProjects collapsed={collapsed} onAction={handleAction} />
      </div>

      <div className="border-t">
        <SidebarItem
          icon={<Home className="w-4 h-4" />}
          label="Settings"
          collapsed={collapsed}
          onClick={() => handleAction("Settings")}
        />
        <SidebarItem
          icon={<Trash className="w-4 h-4" />}
          label="Trash"
          collapsed={collapsed}
          onClick={() => handleAction("Trash")}
        />
      </div>
    </div>
  );
}
