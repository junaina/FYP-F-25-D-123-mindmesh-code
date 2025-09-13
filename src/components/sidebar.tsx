"use client";

import {
  Home,
  Search,
  Inbox,
  FileText,
  MessageSquare,
  Trash2,
  Settings,
  ChevronRight,
  ChevronDown,
  Plus,
  MessageCircle,
  Type,
  Video,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";
import SidebarItem from "./sidebar-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-background border-r flex flex-col overflow-y-auto transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}`}
    >
      {/* User branding */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/default-avatar.png" alt="User Avatar" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 font-semibold text-base leading-tight">
              <div>John Doe&apos;s</div>
              <div>Mindmesh</div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground cursor-pointer" />
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-2 rounded-md hover:bg-muted"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 space-y-1 mt-4">
        <SidebarItem icon={Home} label="Home" href="/home" collapsed={collapsed} />
        <SidebarItem icon={Search} label="Search" href="/search" collapsed={collapsed} />

        {/* Inbox with chevron */}
        <div className="flex items-center justify-between pr-3">
          <SidebarItem icon={Inbox} label="Inbox" href="/inbox" collapsed={collapsed} />
          {!collapsed && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>

        {/* Projects */}
        {!collapsed && (
          <>
            <div className="mt-6 text-xs uppercase text-muted-foreground px-2">
              Projects
            </div>

            {/* Project Alpha header with + and dropdown */}
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-sm font-medium">Project Alpha</span>
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 cursor-pointer" />
                <ChevronDown className="h-4 w-4 cursor-pointer" />
              </div>
            </div>

            {/* Project Alpha items */}
            <div className="ml-4 space-y-1">
              <SidebarItem
                icon={FileText}
                label="Task Board"
                href="/projects/alpha/task-board"
              />
              <SidebarItem
                icon={MessageCircle}
                label="Ask Mindy"
                href="/projects/alpha/ask-mindy"
              />
              <SidebarItem
                icon={MessageSquare}
                label="Discussions"
                href="/projects/alpha/discussions"
              />
              <SidebarItem
                icon={Type}
                label="Documents"
                href="/projects/alpha/documents"
              />
              <SidebarItem
                icon={Video}
                label="Mesh Meet"
                href="/projects/alpha/mesh-meet"
              />
            </div>
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="p-2 border-t">
        <SidebarItem icon={Settings} label="Settings" href="/settings" collapsed={collapsed} />
        <SidebarItem icon={Trash2} label="Trash" href="/trash" collapsed={collapsed} />
      </div>
    </aside>
  );
}
