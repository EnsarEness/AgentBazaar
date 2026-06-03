import type { Agent, Task } from "@/types/economy";

export const mockAgents: Agent[] = [
  {
    id: "agent-backend",
    name: "Backend Agent",
    specialty: "APIs, data models, server logic, integrations",
    balance: 14200,
    reputation: 93,
    strategy:
      "Prioritize stable architecture, clean contracts, and realistic integration risk.",
  },
  {
    id: "agent-frontend",
    name: "Frontend Agent",
    specialty: "Product UI, interaction design, accessibility, client state",
    balance: 11800,
    reputation: 90,
    strategy:
      "Bid higher on polished UX work and account for responsive states and visual QA.",
  },
  {
    id: "agent-testing",
    name: "Testing Agent",
    specialty: "Test plans, automation, regression analysis, QA workflows",
    balance: 9600,
    reputation: 88,
    strategy:
      "Favor tasks with measurable acceptance criteria and price uncertainty conservatively.",
  },
  {
    id: "agent-research",
    name: "Research Agent",
    specialty: "Market research, technical discovery, synthesis, competitive analysis",
    balance: 13100,
    reputation: 95,
    strategy:
      "Win discovery-heavy work by trading implementation speed for deeper analysis.",
  },
  {
    id: "agent-devops",
    name: "DevOps Agent",
    specialty: "Deployment, CI/CD, observability, cloud operations, release safety",
    balance: 16700,
    reputation: 91,
    strategy:
      "Account for operational blast radius, deployment checks, and rollback planning.",
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
    analysis: {
      analysis:
        "Competitive research task focused on feature comparison, positioning, and pricing synthesis.",
      expectedComplexity: "Medium",
      complexityScore: 52,
      skillsRequired: ["Research synthesis", "Market analysis", "Product strategy"],
      reasoningLogs: [
        "Identified the task as research-heavy rather than implementation-heavy.",
        "Budget and deliverable scope suggest medium complexity.",
        "Skills required emphasize competitive analysis and synthesis.",
      ],
    },
  },
  {
    id: "task-ops-agent",
    title: "Prototype refund triage agent",
    description:
      "Create a lightweight agent flow that classifies refund requests and drafts support replies.",
    budget: 4800,
    deadline: "2026-06-14",
    analysis: {
      analysis:
        "Agent workflow prototype requiring classification logic, UX review, and practical support automation.",
      expectedComplexity: "High",
      complexityScore: 74,
      skillsRequired: [
        "Backend engineering",
        "Workflow automation",
        "Testing and QA",
        "Product UX",
      ],
      reasoningLogs: [
        "Detected agent workflow implementation and customer-support constraints.",
        "Classification plus response drafting increases delivery risk.",
        "Skills required span backend logic, QA, and product workflow design.",
      ],
    },
  },
];
