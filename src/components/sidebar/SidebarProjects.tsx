// src/components/sidebar/SidebarProjects.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import SidebarItem from "./SidebarItem";
import SidebarSubmenu from "./SidebarSubmenu";
import SidebarLeaf from "./SidebarLeaf";
import { FolderPlus, ChevronRight, ChevronDown } from "lucide-react";
import type { SidebarProject } from "./sidebarData";
import { initialProjects } from "./sidebarData";

interface SidebarProjectsProps {
  collapsed: boolean;
  onAction: (action: string) => void;
}

type SectionKey = "ask" | "boards" | "docs" | "threads";

const makeKey = (projectId: string, section: SectionKey) =>
  `${projectId}::${section}`;

export default function SidebarProjects({
  collapsed,
  onAction,
}: SidebarProjectsProps) {
  const [projects, setProjects] = useState<SidebarProject[]>(initialProjects);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const draftInputRef = useRef<HTMLInputElement | null>(null);
  const tempIdRef = useRef<string | null>(null);

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleSection = (id: string, section: SectionKey) => {
    const key = makeKey(id, section);
    setSectionOpen((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  const isSectionOpen = (id: string, section: SectionKey) =>
    sectionOpen[makeKey(id, section)] ?? true; // default: open

  const startCreate = () => {
    if (creating) return;
    setCreating(true);
    const id = `temp-${Date.now()}`;
    tempIdRef.current = id;

    setProjects((prev) => [
      {
        id,
        name: "",
        taskBoards: [],
        askMindyChats: [],
        discussions: [],
        wiki: [],
      },
      ...prev,
    ]);
    setExpandedProjects((prev) => [...new Set([id, ...prev])]);

    // default sections to open for the new project
    setSectionOpen((prev) => ({
      ...prev,
      [makeKey(id, "ask")]: true,
      [makeKey(id, "boards")]: true,
      [makeKey(id, "docs")]: true,
      [makeKey(id, "threads")]: true,
    }));

    setTimeout(() => draftInputRef.current?.focus(), 0);
  };

  const cancelCreate = () => {
    setProjects((prev) => prev.filter((p) => p.id !== tempIdRef.current));
    setDraftName("");
    setCreating(false);
    tempIdRef.current = null;
  };

  const commitCreate = () => {
    const name = draftName.trim();
    if (!name) return cancelCreate();
    const id = tempIdRef.current!;
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    setDraftName("");
    setCreating(false);
    onAction(`Created Project: ${name}`);
  };

  useEffect(() => {
    if (creating) draftInputRef.current?.focus();
  }, [creating]);

  return (
    <div>
      {!collapsed && (
        <div className="px-4 py-2 text-xs uppercase text-muted-foreground">
          Projects
        </div>
      )}

      <SidebarItem
        icon={<FolderPlus className="w-4 h-4" />}
        label="New Project"
        collapsed={collapsed}
        active={creating}
        onClick={startCreate}
      />

      {projects.map((project) => {
        const isTemp = project.id === tempIdRef.current;
        const isExpanded = expandedProjects.includes(project.id);

        return (
          <div key={project.id}>
            <div
              className="flex items-center justify-between px-4 py-2 hover:bg-accent cursor-pointer"
              onClick={() => toggleProject(project.id)}
            >
              {isTemp && creating ? (
                collapsed ? (
                  <span className="text-sm opacity-70">…</span>
                ) : (
                  <input
                    ref={draftInputRef}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitCreate();
                      if (e.key === "Escape") cancelCreate();
                    }}
                    onBlur={commitCreate}
                    placeholder="Untitled project"
                    className="w-full bg-transparent outline-none border-b border-border text-sm"
                  />
                )
              ) : (
                <span>
                  {collapsed
                    ? project.name[0] ?? "?"
                    : project.name || "Untitled"}
                </span>
              )}

              {!collapsed &&
                (isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                ))}
            </div>

            {/* Expanded project content */}
            {isExpanded && !collapsed && (
              <div className="ml-4">
                {/* Ask Mindy */}
                <SidebarSubmenu
                  label="Ask Mindy"
                  items={project.askMindyChats}
                  expanded={isSectionOpen(project.id, "ask")}
                  onToggle={() => toggleSection(project.id, "ask")}
                  onClick={(chat: string) => onAction(`Chat: ${chat}`)}
                />

                {/* Task Board */}
                <SidebarSubmenu
                  label="Task Board"
                  items={project.taskBoards}
                  expanded={isSectionOpen(project.id, "boards")}
                  onToggle={() => toggleSection(project.id, "boards")}
                  onClick={(board: string) => onAction(`Board: ${board}`)}
                />

                {/* Documents */}
                <SidebarSubmenu
                  label="Documents"
                  items={project.wiki}
                  expanded={isSectionOpen(project.id, "docs")}
                  onToggle={() => toggleSection(project.id, "docs")}
                  onClick={(doc: string) => onAction(`Document: ${doc}`)}
                />

                {/* Discussions */}
                <SidebarSubmenu
                  label="Discussions"
                  items={project.discussions}
                  expanded={isSectionOpen(project.id, "threads")}
                  onToggle={() => toggleSection(project.id, "threads")}
                  onClick={(thread: string) =>
                    onAction(`Discussion: ${thread}`)
                  }
                />

                {/* Mesh Meet – remains a leaf */}
                <SidebarLeaf
                  label="Mesh Meet"
                  onClick={() => onAction(`Mesh Meet in ${project.name}`)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
