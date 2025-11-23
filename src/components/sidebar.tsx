"use client";
import InviteTeammateModal from "./sidebar/InviteTeammateModel";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useState } from "react";
import { useEffect } from "react";
import { userApi, type MeForSidebar } from "@/modules/user/client/user.api";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import CreateProjectModal from "@/components/sidebar/CreateProjectModal";
import SidebarItem from "./sidebar-item";
import ProjectSearchModal from "@/components/search/ProjectSearchModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  projectsApi,
  type ProjectLite,
} from "@/modules/projects/client/project.api";
import Link from "next/link";
import { useMemo } from "react";
// add types for a tiny doc record
import { makeDocView } from "./desk/utils/view-utils";
const COLLAPSED_W = 72; // px — what your collapsed state looks like
const EXPANDED_W = 256; // px — your `w-64` expanded width
type DocLite = { id: string; title: string | null };
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [me, setMe] = useState<MeForSidebar | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectLite[] | null>(null);
  const [pErr, setPErr] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});
  const [inviteProject, setInviteProject] = useState<ProjectLite | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  // delete confirmation state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(
    null
  );
  // controls whether the Documents sub-list is expanded for each project
  const [openDocsByProject, setOpenDocsByProject] = useState<
    Record<string, boolean>
  >({});
  // inside component state
  const [docsByProject, setDocsByProject] = useState<Record<string, DocLite[]>>(
    {}
  );
  useEffect(() => {
    // mark that the layout has an app sidebar
    document.body.classList.add("has-app-sb");

    // set the CSS variable to match the current sidebar width
    const w = collapsed ? COLLAPSED_W : EXPANDED_W;
    document.body.style.setProperty("--sb-w", `${w}px`);

    // optional: set a default on mount if nothing has set it yet
    if (!getComputedStyle(document.body).getPropertyValue("--sb-w").trim()) {
      document.body.style.setProperty("--sb-w", `${COLLAPSED_W}px`);
    }

    return () => {
      // if this sidebar unmounts (rare), keep the var but you could also clean it:
      // document.body.style.removeProperty('--sb-w');
    };
  }, [collapsed]);

  const [searchOpen, setSearchOpen] = useState(false);
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
  // helper to lazy-load docs for a project (adjust API to your actual client)
  async function loadDocs(projectId: string) {
    if (docsByProject[projectId]) return;
    try {
      const r = await fetch(`/api/projects/${projectId}/docs?lite=1`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to load docs");
      const docs = (await r.json()) as DocLite[];
      setDocsByProject((m) => ({ ...m, [projectId]: docs }));
    } catch (e) {
      console.error(e);
      setDocsByProject((m) => ({ ...m, [projectId]: [] }));
    }
  }

  // change toggleProject to also lazy load docs when opening
  function toggleProject(id: string) {
    setOpenProjects((prev) => {
      const next = !prev[id];
      if (next) loadDocs(id);
      return { ...prev, [id]: next };
    });
  }

  function startRename(p: ProjectLite) {
    setEditingId(p.id);
    setEditingName(p.name);
  }
  async function commitRename() {
    if (!editingId) return;
    const id = editingId;
    const newName = editingName.trim();
    if (!newName) return; // no empty names

    // optimistic update
    setProjects((prev) =>
      prev ? prev.map((x) => (x.id === id ? { ...x, name: newName } : x)) : prev
    );

    setEditingId(null);

    try {
      await projectsApi.rename(id, newName);
    } catch (e: any) {
      // rollback on error
      setProjects((prev) =>
        prev
          ? prev.map((x) =>
              x.id === id
                ? {
                    ...x,
                    name: projects?.find((p) => p.id === id)?.name || x.name,
                  }
                : x
            )
          : prev
      );
      console.error(e);
      alert(e?.message ?? "Failed to rename project");
    }
  }

  function cancelRename() {
    setEditingId(null);
    setEditingName("");
  }
  function askDelete(p: ProjectLite) {
    setToDelete({ id: p.id, name: p.name });
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    setConfirmOpen(false);
    setToDelete(null);

    // optimistic removal
    const prev = projects;
    setProjects((cur) => (cur ? cur.filter((x) => x.id !== id) : cur));

    try {
      await projectsApi.remove(id);
    } catch (e: any) {
      // rollback on error
      setProjects(prev);
      console.error(e);
      alert(e?.message ?? "Failed to delete project");
    }
  }
  return (
    <aside
      data-app-sidebar
      className={`fixed left-0 top-0 h-screen bg-background border-r flex flex-col overflow-y-auto transition-all duration-300
        ${collapsed ? "w-30" : "w-64"} z-50`}
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
            <Link
              href="/settings"
              aria-label="Profile Settings"
              title="Settings"
              className="cursor-pointer"
            >
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
                </div>
              </div>
            </Link>
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

        <button
          onClick={() => setSearchOpen(true)}
          className="w-full"
          aria-label="Search (⌘K)"
          title="Search (⌘K)"
        >
          <SidebarItem
            icon={Search}
            label="Search"
            href="#"
            collapsed={collapsed}
          />
        </button>

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

            {/* projects list */}
            {projects && projects.length > 0 && (
              <div className="mt-2">
                {projects.map((p) => {
                  const isOpen = !!openProjects[p.id];

                  return (
                    <ContextMenu key={p.id}>
                      <ContextMenuTrigger asChild>
                        <div className="mb-1 group">
                          {/* project row */}
                          <div className="w-full flex items-center justify-between px-2 py-1 rounded-md hover:bg-muted transition">
                            {/* LEFT: name (button toggles open unless editing) */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {editingId === p.id ? (
                                <input
                                  autoFocus
                                  value={editingName}
                                  onChange={(e) =>
                                    setEditingName(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") commitRename();
                                    if (e.key === "Escape") cancelRename();
                                  }}
                                  onBlur={commitRename}
                                  className="h-6 w-full rounded-md border px-2 text-sm font-medium bg-background
                                    focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              ) : (
                                <button
                                  onClick={() => toggleProject(p.id)}
                                  onDoubleClick={() => startRename(p)}
                                  className="text-left flex-1 min-w-0"
                                  aria-expanded={isOpen}
                                  aria-controls={`proj-${p.id}-menu`}
                                >
                                  <span className="text-sm font-medium truncate">
                                    {p.name}
                                  </span>
                                </button>
                              )}
                            </div>

                            {/* RIGHT BUTTONS */}
                            <div className="flex items-center gap-1">
                              {editingId !== p.id && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startRename(p)}
                                    title="Rename"
                                    className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center
                                      h-6 w-6 rounded hover:bg-muted/60 text-muted-foreground transition"
                                  >
                                    <Type className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => askDelete(p)}
                                    title="Delete"
                                    className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center
                                      h-6 w-6 rounded hover:bg-red-500/10 text-red-500 transition"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => toggleProject(p.id)}
                                aria-expanded={isOpen}
                                aria-controls={`proj-${p.id}-menu`}
                                className="h-6 w-6 grid place-items-center rounded hover:bg-muted/60"
                              >
                                {isOpen ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* SUBMENU: only when project row is open */}
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

                              {/* Documents parent row (collapsible) */}
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenDocsByProject((prev) => ({
                                      ...prev,
                                      [p.id]: !prev[p.id],
                                    }))
                                  }
                                  className="w-full flex items-center justify-between px-4 py-2 rounded-md text-sm hover:bg-muted transition"
                                >
                                  <div className="flex items-center gap-2">
                                    <Type className="h-5 w-5 shrink-0" />
                                    <span className="truncate">Documents</span>
                                  </div>
                                  <ChevronDown
                                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                                      openDocsByProject[p.id]
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  />
                                </button>
                              </div>

                              {/* scrollable docs list when Documents is open */}
                              {openDocsByProject[p.id] && (
                                <div className="max-h-60 overflow-y-auto pr-1">
                                  {(docsByProject[p.id] ?? []).map((d) => (
                                    <SidebarItem
                                      key={d.id}
                                      icon={Type}
                                      label={d.title || "Untitled"}
                                      href={`/projects/${p.id}/docs/${d.id}`}
                                      viewConfig={{
                                        kind: "document",
                                        id: d.id,
                                        title: d.title || "Untitled",
                                        params: { projectId: p.id },
                                      }}
                                      title="Drag to Desk or Alt-click to open in a tab"
                                    />
                                  ))}

                                  {docsByProject[p.id] &&
                                    (docsByProject[p.id] as DocLite[])
                                      .length === 0 && (
                                      <div className="px-4 py-2 text-xs text-muted-foreground">
                                        No documents
                                      </div>
                                    )}
                                </div>
                              )}

                              <SidebarItem
                                icon={Video}
                                label="Mesh Meet"
                                href={`/projects/${p.id}/mesh-meet`}
                              />
                            </div>
                          )}
                        </div>
                      </ContextMenuTrigger>

                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => startRename(p)}>
                          Rename
                        </ContextMenuItem>

                        <ContextMenuItem onClick={() => askDelete(p)}>
                          Delete
                        </ContextMenuItem>

                        <ContextMenuItem
                          onClick={() => {
                            setInviteProject(p);
                            setInviteOpen(true);
                          }}
                        >
                          Invite teammate
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
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
        {/* <SidebarItem
          icon={Trash2}
          label="Trash"
          href="/trash"
          collapsed={collapsed}
        /> */}
      </div>

      <CreateProjectModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(project) => {
          setProjects((prev) => (prev ? [project, ...prev] : [project]));
          setOpenProjects((prev) => ({ ...prev, [project.id]: true })); // auto-expand
        }}
      />

      {projects && (
        <ProjectSearchModal
          open={searchOpen}
          onOpenChange={setSearchOpen}
          projects={projects}
        />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `“${toDelete.name}” and its content will be permanently removed. This action cannot be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {inviteProject && (
        <InviteTeammateModal
          open={inviteOpen}
          onOpenChange={(open) => {
            setInviteOpen(open);
            if (!open) setInviteProject(null);
          }}
          project={inviteProject}
        />
      )}
    </aside>
  );
}
