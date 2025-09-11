import {
  CalendarData,
  CalendarItem,
  ID,
  PropertySchema,
} from "@/types/calendar";
import { toISO, addDays } from "@/lib/calendar-date";

const genId = (): ID => Math.random().toString(36).slice(2, 10) as ID;

export const seedCalendar = (): CalendarData => {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), 1);

  // Give the variable an explicit type instead of using `as any` / `as const`
  const propertySchemas: PropertySchema[] = [
    {
      id: "status",
      name: "Status",
      kind: "status",
      options: [
        { id: "todo", label: "To Do", color: "sky" },
        { id: "doing", label: "In Progress", color: "amber" },
        { id: "done", label: "Done", color: "emerald" },
      ],
    },
    {
      id: "project",
      name: "Project",
      kind: "select",
      options: [
        { id: "frontend", label: "Frontend", color: "indigo" },
        { id: "backend", label: "Backend", color: "purple" },
        { id: "docs", label: "Docs", color: "violet" },
      ],
    },
    {
      id: "tags",
      name: "Tags",
      kind: "multi_select",
      options: [
        { id: "bug", label: "Bug", color: "red" },
        { id: "feature", label: "Feature", color: "green" },
        { id: "research", label: "Research", color: "cyan" },
        { id: "review", label: "Review", color: "yellow" },
      ],
    },
    { id: "estimate", name: "Estimate (hrs)", kind: "number" },
    { id: "assignees", name: "Assignees", kind: "person" },
    { id: "billable", name: "Billable", kind: "checkbox" },
    { id: "link", name: "URL", kind: "url" },
    { id: "created", name: "Created", kind: "date" },
  ];

  const people = [
    { id: "p1", name: "Ryo" },
    { id: "p2", name: "Mindy" },
    { id: "p3", name: "Taylor" },
  ];

  const mkItem = (
    title: string,
    dayOffset: number,
    overrides: Partial<CalendarItem> = {}
  ): CalendarItem => ({
    id: genId(),
    title,
    date: toISO(addDays(base, dayOffset)),
    description: "",
    properties: {
      status: { kind: "status", optionId: "todo" },
      project: { kind: "select", optionId: "frontend" },
      tags: { kind: "multi_select", optionIds: ["feature"] },
      estimate: { kind: "number", value: 2 },
      assignees: { kind: "person", userIds: ["p1"] },
      billable: { kind: "checkbox", value: true },
      link: { kind: "url", value: "https://example.com" },
      created: { kind: "date", value: toISO(new Date()) },
    },
    ...overrides,
  });

  const items: CalendarItem[] = [
    mkItem("Hours page – wireframe", 0, {
      properties: {
        status: { kind: "status", optionId: "doing" },
        project: { kind: "select", optionId: "frontend" },
        tags: { kind: "multi_select", optionIds: ["feature", "review"] },
        estimate: { kind: "number", value: 6 },
        assignees: { kind: "person", userIds: ["p1", "p2"] },
        billable: { kind: "checkbox", value: true },
        link: { kind: "url", value: "https://figma.com/file/abc" },
        created: { kind: "date", value: toISO(addDays(base, 0)) },
      },
    }),
    mkItem("Integrate auth flow", 3, {
      properties: {
        status: { kind: "status", optionId: "todo" },
        project: { kind: "select", optionId: "backend" },
        tags: { kind: "multi_select", optionIds: ["feature"] },
        estimate: { kind: "number", value: 8 },
        assignees: { kind: "person", userIds: ["p3"] },
        billable: { kind: "checkbox", value: false },
        link: { kind: "url", value: null },
        created: { kind: "date", value: toISO(addDays(base, 3)) },
      },
    }),
    mkItem("Fix calendar overflow bug", 10, {
      properties: {
        status: { kind: "status", optionId: "doing" },
        project: { kind: "select", optionId: "frontend" },
        tags: { kind: "multi_select", optionIds: ["bug"] },
        estimate: { kind: "number", value: 3 },
        assignees: { kind: "person", userIds: ["p2"] },
        billable: { kind: "checkbox", value: true },
        link: { kind: "url", value: "https://linear.app/bug/123" },
        created: { kind: "date", value: toISO(addDays(base, 10)) },
      },
    }),
    mkItem("Write onboarding docs", 15, {
      properties: {
        status: { kind: "status", optionId: "todo" },
        project: { kind: "select", optionId: "docs" },
        tags: { kind: "multi_select", optionIds: ["research", "review"] },
        estimate: { kind: "number", value: 4 },
        assignees: { kind: "person", userIds: ["p1"] },
        billable: { kind: "checkbox", value: false },
        link: { kind: "url", value: "https://docs.google.com/document/d/xyz" },
        created: { kind: "date", value: toISO(addDays(base, 15)) },
      },
    }),
  ];

  return {
    title: "Work Log",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    propertySchemas,
    people,
    items,
  };
};
