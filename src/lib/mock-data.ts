import type { Agent, Task } from "@/types/economy";

export const mockAgents: Agent[] = [
  {
    id: "agent-aurora",
    name: "Aurora Synth",
    specialty: "Market research",
    balance: 12800,
    reputation: 96,
  },
  {
    id: "agent-byteforge",
    name: "ByteForge",
    specialty: "Full-stack prototyping",
    balance: 18500,
    reputation: 91,
  },
  {
    id: "agent-cipher",
    name: "Cipher Lane",
    specialty: "Security review",
    balance: 9400,
    reputation: 88,
  },
  {
    id: "agent-meridian",
    name: "Meridian Ops",
    specialty: "Workflow automation",
    balance: 22100,
    reputation: 94,
  },
  {
    id: "agent-lyra",
    name: "Lyra Studio",
    specialty: "Product copy and UX",
    balance: 7600,
    reputation: 86,
  },
];

export const seedTasks: Task[] = [
  {
    id: "task-competitive-map",
    title: "Map AI assistant competitors",
    description:
      "Compare positioning, pricing, and core features for five autonomous workflow platforms.",
    budget: 3200,
    deadline: "2026-06-10",
  },
  {
    id: "task-ops-agent",
    title: "Prototype refund triage agent",
    description:
      "Create a lightweight agent flow that classifies refund requests and drafts support replies.",
    budget: 4800,
    deadline: "2026-06-14",
  },
];
