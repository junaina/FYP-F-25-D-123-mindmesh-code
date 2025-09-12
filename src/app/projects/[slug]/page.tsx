"use client";

import { use } from "react";
import SectionHeader from "@/components/section-header";
import ActionTile from "@/components/ui/action-tile";
import EntityCard from "@/components/ui/entity-card";
import { AssigneeAvatar } from "@/components/kanban/AssigneeAvatar"; 
import type { ProjectOverview } from "@/types/dashboard";
import Sidebar from "@/components/sidebar";
import ThemeToggle from "@/components/theme-toggle"; 
import ProjectMenu from "@/components/projectmenu";


function toTitle(str: string) {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProjectDashboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const projectName = toTitle(slug ?? "project");

  // --- Mock data ---
  const data: ProjectOverview = {
    name: projectName,
    quickActions: [
      { id: "new-doc", label: "New Doc", href: "#", iconName: "file-plus-2" },
      { id: "new-discussion", label: "New Discussion", href: "#", iconName: "message-square-plus" },
      { id: "new-meeting", label: "New Meeting", href: "#", iconName: "video" },
    ],
    docs: [
      { id: "notes", title: "Notes", description: "Description: Lorem ipsum dolor sit", placeholder: "bg-zinc-700" },
      { id: "briefing", title: "Briefing Doc", description: "Description: Lorem ipsum dolor sit", placeholder: "bg-zinc-700/90" },
    ],
    tasks: [
      { id: "monthly", title: "Monthly Tracker", description: "Tracking monthly progress" },
      { id: "misc", title: "Miscellaneous Tasks", description: "Random tasks" },
      { id: "daily", title: "Daily Tasks", description: "Daily to-dos" },
    ],
    threads: [
      {
        id: "general",
        title: "#general",
        description: "say hi 👋",
        assignees: [
          { id: "1", name: "Alice Johnson", avatarUrl: "/avatars/alice.png" },
          { id: "2", name: "Bob Lee", avatarUrl: "/avatars/bob.png" },
          { id: "3", name: "Charlie Kim", avatarUrl: "/avatars/charlie.png" },
          { id: "4", name: "Daisy Chen", avatarUrl: "/avatars/daisy.png" },
        ],
      },
      {
        id: "announcements",
        title: "#announcements",
        description: "Important announcements to track",
        assignees: [
          { id: "5", name: "Emma Stone", avatarUrl: "/avatars/emma.png" },
          { id: "6", name: "Frank Zhao", avatarUrl: "/avatars/frank.png" },
        ],
      },
      {
        id: "brainstorming",
        title: "#brainstorming",
        description: "Throw ideas & creative juices flowing 💡",
        assignees: [
          { id: "7", name: "Grace Hopper", avatarUrl: "/avatars/grace.png" },
          { id: "8", name: "Hank Pym", avatarUrl: "/avatars/hank.png" },
          { id: "9", name: "Ivy Lin", avatarUrl: "/avatars/ivy.png" },
        ],
      },
    ],
  };
  // ----------------------------------------------------------

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-center flex-1">{data.name}</h1>
             <ProjectMenu /> 
            <ThemeToggle /> {/*  toggle on the right */}
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <SectionHeader>Quick Actions</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data.quickActions.map((a) => (
                <ActionTile key={a.id} label={a.label} href={a.href} iconName={a.iconName} />
              ))}
            </div>
          </div>

          {/* Docs */}
          <div className="space-y-3">
            <SectionHeader>Docs</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.docs.map((d) => (
                <EntityCard
                  key={d.id}
                  variant="thumb"
                  title={d.title}
                  description={d.description}
                  thumbnail={d.cover}
                  placeholder={d.placeholder}
                  href={d.href}
                />
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            <SectionHeader>Tasks</SectionHeader>
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(14rem,14rem))] gap-3">
              {data.tasks.map((t) => (
                <EntityCard
                  key={t.id}
                  variant="compact"
                  title={t.title}
                  description={t.description}
                  href={t.href}
                />
              ))}
            </div>
          </div>

          {/* Threads */}
          <div className="space-y-3">
            <SectionHeader>Threads</SectionHeader>
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(14rem,14rem))] gap-3">
              {data.threads.map((th) => (
                <EntityCard
                  key={th.id}
                  variant="compact"
                  title={th.title}
                  description={th.description}
                  href={th.href}
                  className="relative"
                >
                  {/* Avatars at top */}
                  <div className="flex -space-x-2 mb-2">
                    {th.assignees?.slice(0, 3).map((user) => (
                      <AssigneeAvatar key={user.id} user={user} />
                    ))}
                    {th.assignees && th.assignees.length > 3 && (
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-pink-500 text-xs font-bold text-white ring-2 ring-neutral-900">
                        +{th.assignees.length - 3}
                      </span>
                    )}
                  </div>
                </EntityCard>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}