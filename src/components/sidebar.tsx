"use client";

import {
  Home,
  Search,
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
import { useEffect } from "react";
import { userApi, type MeForSidebar } from "@/modules/user/client/user.api";

import CreateProjectModal from "@/components/sidebar/CreateProjectModal";
import SidebarItem from "./sidebar-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  projectsApi,
  type ProjectLite,
} from "@/modules/projects/client/project.api";
import Link from "next/link";
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [me, setMe] = useState<MeForSidebar | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectLite[] | null>(null);
  const [pErr, setPErr] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    userApi
      .meForSidebar()
      .then(setMe)
      .catch((e) => setErr(e?.message ?? "Failed to load profile"));
  }, []);
  useEffect(() => {
    projectsApi
      .list()
      .then(setProjects)
      .catch((e) => setPErr(e?.message ?? "Failed to load projects"));
  }, []);
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});

  function toggleProject(id: string) {
    setOpenProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-background border-r flex flex-col overflow-y-auto transition-all duration-300
        ${collapsed ? "w-30" : "w-64"}`}
    >
      {/* User branding */}
      <div className="flex items-center justify-between p-4 border-b">
        {/* LEFT: avatar + name (or skeleton / error) */}
        {!collapsed &&
          (err ? (
            <div className="text-xs text-red-500" role="status">
              Failed to load
            </div>
          ) : !me ? (
            // skeleton (non-collapsed)
            <div className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            </div>
          ) : (
            // real content (non-collapsed)
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {me.avatarUrl ? (
                  <AvatarImage src={me.avatarUrl} alt={me.displayName} />
                ) : (
                  <AvatarFallback
                    className="font-semibold"
                    style={{ backgroundColor: me.fallbackColor }}
                    title={me.displayName}
                    aria-label={me.displayName}
                  >
                    {me.initials /* or me.fallbackEmoji */}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1 font-semibold text-base leading-tight">
                <div>{me.displayName}</div>
                <div>Mindmesh</div>
              </div>

              <ChevronDown className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
          ))}

        {collapsed &&
          (err ? null : !me ? (
            // skeleton (collapsed)
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          ) : (
            // real content (collapsed): just the circle
            <Avatar className="h-10 w-10">
              {me.avatarUrl ? (
                <AvatarImage src={me.avatarUrl} alt={me.displayName} />
              ) : (
                <AvatarFallback
                  className="font-semibold"
                  style={{ backgroundColor: me.fallbackColor }}
                  title={me.displayName}
                  aria-label={me.displayName}
                >
                  {me.initials}
                </AvatarFallback>
              )}
            </Avatar>
          ))}
        {/* Collapse toggle (always visible) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
          className="relative top-1 ml-2 right-0 z-70 h-8 w-8 rounded-full border bg-background shadow
             hover:bg-muted grid place-items-center"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 space-y-1 mt-4">
        <SidebarItem
          icon={Home}
          label="Home"
          href="/home"
          collapsed={collapsed}
        />
        <SidebarItem
          icon={Search}
          label="Search"
          href="/search"
          collapsed={collapsed}
        />

        {/* Projects */}
        {!collapsed && (
          <>
            <div className="mt-6 text-xs uppercase text-muted-foreground px-2 flex items-center justify-between">
              <span>Projects</span>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                aria-label="Create project"
                className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-muted/60 text-muted-foreground"
                title="Create project"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* loading skeleton */}
            {!projects && !pErr && (
              <div className="mt-2 space-y-1 px-2">
                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                <div className="h-4 w-44 bg-muted rounded animate-pulse" />
                <div className="h-4 w-36 bg-muted rounded animate-pulse" />
              </div>
            )}

            {/* error */}
            {pErr && (
              <div className="px-2 py-1 text-xs text-red-500">{pErr}</div>
            )}

            {/* empty */}
            {projects && projects.length === 0 && (
              <div className="px-2 py-1 text-xs text-muted-foreground">
                No projects yet.
              </div>
            )}

            {/* list of projects with the 5 static sub-items each */}
            {projects && projects.length > 0 && (
              <div className="mt-2">
                {projects.map((p) => {
                  const isOpen = !!openProjects[p.id];
                  return (
                    <div key={p.id} className="mb-1">
                      {/* project row */}
                      <button
                        onClick={() => toggleProject(p.id)}
                        className="w-full flex items-center justify-between px-2 py-1 rounded-md hover:bg-muted transition"
                        aria-expanded={isOpen}
                        aria-controls={`proj-${p.id}-menu`}
                      >
                        <span className="text-sm font-medium">{p.name}</span>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      {/* submenu — your same 5 items, but project-scoped */}
                      {isOpen && (
                        <div
                          id={`proj-${p.id}-menu`}
                          className="ml-4 space-y-1"
                        >
                          <SidebarItem
                            icon={FileText}
                            label="Task Board"
                            href={`/projects/${p.id}/task-board`}
                          />
                          <SidebarItem
                            icon={MessageCircle}
                            label="Ask Mindy"
                            href={`/projects/${p.id}/ask-mindy`}
                          />
                          <SidebarItem
                            icon={MessageSquare}
                            label="Discussions"
                            href={`/projects/${p.id}/discussions`}
                          />
                          <SidebarItem
                            icon={Type}
                            label="Documents"
                            href={`/projects/${p.id}/documents`}
                          />
                          <SidebarItem
                            icon={Video}
                            label="Mesh Meet"
                            href={`/projects/${p.id}/mesh-meet`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="p-2 border-t">
        <SidebarItem
          icon={Settings}
          label="Settings"
          href="/settings"
          collapsed={collapsed}
        />
        <SidebarItem
          icon={Trash2}
          label="Trash"
          href="/trash"
          collapsed={collapsed}
        />
      </div>
      <CreateProjectModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(project) => {
          setProjects((prev) => (prev ? [project, ...prev] : [project]));
          setOpenProjects((prev) => ({ ...prev, [project.id]: true })); // auto-expand
        }}
      />
    </aside>
  );
}
