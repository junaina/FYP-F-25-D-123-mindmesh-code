import type { CalendarItem } from "@/types/calendar";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export const seedItems: CalendarItem[] = [
  {
    id: "seed-1",
    date: isoDate(new Date()),
    title: "Kickoff meeting",
    createdAt: new Date().toISOString(),
    properties: {
      Status: {
        id: "p1",
        name: "Status",
        color: "blue",
        value: { kind: "select", value: { label: "Planned", color: "blue" } },
      },
      Priority: {
        id: "p2",
        name: "Priority",
        color: "red",
        value: { kind: "select", value: { label: "High", color: "red" } },
      },
      Tags: {
        id: "p3",
        name: "Tags",
        value: {
          kind: "multi_select",
          value: [
            { label: "Launch", color: "green" },
            { label: "PMM", color: "violet" },
          ],
        },
      },
      Assignee: {
        id: "p4",
        name: "Assignee",
        color: "purple",
        value: {
          kind: "person",
          value: { id: "u1", name: "Alex Chen", email: "alex@example.com" },
        },
      },
      "Est. Hours": {
        id: "p5",
        name: "Est. Hours",
        value: { kind: "number", value: 3 },
      },
      Email: {
        id: "p6",
        name: "Email",
        value: { kind: "email", value: "kickoff@mindmesh.dev" },
      },
      Approved: {
        id: "p7",
        name: "Approved",
        value: { kind: "checkbox", value: false },
      },
      Docs: {
        id: "p8",
        name: "Docs",
        value: { kind: "file", value: [{ name: "Agenda.pdf", url: "#" }] },
      },
      When: {
        id: "p9",
        name: "When",
        value: {
          kind: "date_time",
          value: { start: new Date().toISOString() },
        },
      },
      Label: {
        id: "p10",
        name: "Label",
        value: { kind: "text", value: "Marketing", color: "pink" },
      },
    },
  },
  {
    id: "seed-2",
    date: isoDate(new Date(Date.now() + 4 * 24 * 3600 * 1000)),
    title: "Write PRD draft",
    createdAt: new Date().toISOString(),
    properties: {
      Status: {
        id: "p11",
        name: "Status",
        value: {
          kind: "select",
          value: { label: "In Progress", color: "yellow" },
        },
      },
      Tags: {
        id: "p12",
        name: "Tags",
        value: {
          kind: "multi_select",
          value: [{ label: "Spec", color: "teal" }],
        },
      },
      Assignee: {
        id: "p13",
        name: "Assignee",
        value: { kind: "person", value: { id: "u2", name: "Sam Rivera" } },
      },
      Approved: {
        id: "p14",
        name: "Approved",
        value: { kind: "checkbox", value: true },
      },
    },
  },
];
