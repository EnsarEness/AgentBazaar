"use client";

import { create } from "zustand";
import { mockAgents, seedTasks } from "@/lib/mock-data";
import type {
  Agent,
  AgentEconomy,
  AgentMemory,
  AgentMemoryTask,
  AgentMemoryOutcome,
  AuctionHistory,
  Bid,
  EconomyHistoryEntry,
  StellarEscrow,
  StellarPayment,
  Task,
  TaskOutcome,
} from "@/types/economy";

type EconomyState = {
  agents: Agent[];
  tasks: Task[];
  bids: Bid[];
  auctionHistories: Record<string, AuctionHistory>;
  awarded: Record<string, string>;
  taskOutcomes: Record<string, TaskOutcome>;
  agentEconomy: Record<string, AgentEconomy>;
  agentMemories: Record<string, AgentMemory>;
  stellarPayments: Record<string, StellarPayment>;
  stellarEscrows: Record<string, StellarEscrow>;
  isGeneratingBids: boolean;
  bidError: string | null;
  addTask: (task: Omit<Task, "id">) => Task;
  generateBids: (taskId: string) => Promise<void>;
  awardBid: (taskId: string, agentId: string) => void;
  failTask: (taskId: string) => void;
  recordStellarPayment: (payment: StellarPayment) => void;
  recordStellarEscrow: (escrow: StellarEscrow) => void;
  getBidsForTask: (taskId: string) => Bid[];
};

function createInitialAgentEconomy(agents: Agent[]) {
  const timestamp = new Date().toISOString();

  return agents.reduce<Record<string, AgentEconomy>>((economy, agent) => {
    economy[agent.id] = {
      agentId: agent.id,
      earnings: 0,
      completedJobs: 0,
      failedJobs: 0,
      balanceHistory: [
        {
          taskId: "initial",
          taskTitle: "Initial balance",
          timestamp,
          value: agent.balance,
          delta: 0,
          reason: "Starting marketplace balance.",
        },
      ],
      reputationHistory: [
        {
          taskId: "initial",
          taskTitle: "Initial reputation",
          timestamp,
          value: agent.reputation,
          delta: 0,
          reason: "Starting marketplace reputation.",
        },
      ],
      completedJobHistory: [],
    };
    return economy;
  }, {});
}

function createInitialAgentMemories(agents: Agent[]) {
  return agents.reduce<Record<string, AgentMemory>>((memories, agent) => {
    memories[agent.id] = {
      agentId: agent.id,
      previousTasks: [],
      previousWins: [],
      previousLosses: [],
      preferredTaskCategories: {},
      memoryNotes: ["No prior marketplace memory yet."],
    };
    return memories;
  }, {});
}

function appendHistory(
  history: EconomyHistoryEntry[],
  entry: EconomyHistoryEntry,
) {
  return [...history, entry];
}

function getTaskCategories(task: Task) {
  const categories = task.analysis?.skillsRequired?.length
    ? task.analysis.skillsRequired
    : [task.title.split(" ").slice(0, 2).join(" ") || "General task"];

  return categories.slice(0, 6);
}

function createMemoryTask(
  task: Task,
  outcome: AgentMemoryOutcome,
  amount?: number,
): AgentMemoryTask {
  return {
    taskId: task.id,
    taskTitle: task.title,
    categories: getTaskCategories(task),
    outcome,
    amount,
    rememberedAt: new Date().toISOString(),
  };
}

function upsertMemoryTask(
  tasks: AgentMemoryTask[],
  entry: AgentMemoryTask,
) {
  return [entry, ...tasks.filter((task) => task.taskId !== entry.taskId)].slice(
    0,
    12,
  );
}

function updatePreferredCategories(
  categories: Record<string, number>,
  taskCategories: string[],
  delta: number,
) {
  return taskCategories.reduce<Record<string, number>>(
    (nextCategories, category) => {
      const nextValue = Math.max(0, (nextCategories[category] ?? 0) + delta);
      if (nextValue === 0) {
        delete nextCategories[category];
      } else {
        nextCategories[category] = nextValue;
      }
      return nextCategories;
    },
    { ...categories },
  );
}

function rememberSeenTask(memory: AgentMemory, task: Task) {
  const entry = createMemoryTask(task, "seen");

  return {
    ...memory,
    previousTasks: upsertMemoryTask(memory.previousTasks, entry),
    memoryNotes: [
      `Received ${task.title} for bidding context.`,
      ...memory.memoryNotes,
    ].slice(0, 6),
  };
}

function rememberWin(memory: AgentMemory, task: Task, amount: number) {
  const entry = createMemoryTask(task, "won", amount);

  return {
    ...memory,
    previousTasks: upsertMemoryTask(memory.previousTasks, entry),
    previousWins: upsertMemoryTask(memory.previousWins, entry),
    previousLosses: memory.previousLosses.filter(
      (loss) => loss.taskId !== task.id,
    ),
    preferredTaskCategories: updatePreferredCategories(
      memory.preferredTaskCategories,
      entry.categories,
      1,
    ),
    memoryNotes: [
      `Won ${task.title}; increased confidence for ${entry.categories.join(", ")} tasks.`,
      ...memory.memoryNotes,
    ].slice(0, 6),
  };
}

function rememberLoss(memory: AgentMemory, task: Task) {
  const entry = createMemoryTask(task, "lost");

  return {
    ...memory,
    previousTasks: upsertMemoryTask(memory.previousTasks, entry),
    previousLosses: upsertMemoryTask(memory.previousLosses, entry),
    memoryNotes: [
      `Lost ${task.title}; future bids will be more selective for similar work.`,
      ...memory.memoryNotes,
    ].slice(0, 6),
  };
}

function rememberFailure(memory: AgentMemory, task: Task) {
  const entry = createMemoryTask(task, "failed");

  return {
    ...memory,
    previousTasks: upsertMemoryTask(memory.previousTasks, entry),
    previousWins: memory.previousWins.filter((win) => win.taskId !== task.id),
    previousLosses: upsertMemoryTask(memory.previousLosses, entry),
    preferredTaskCategories: updatePreferredCategories(
      memory.preferredTaskCategories,
      entry.categories,
      -1,
    ),
    memoryNotes: [
      `Failed ${task.title}; reduced preference for ${entry.categories.join(", ")} tasks.`,
      ...memory.memoryNotes,
    ].slice(0, 6),
  };
}

export const useEconomyStore = create<EconomyState>((set, get) => ({
  agents: mockAgents,
  tasks: seedTasks,
  bids: [],
  auctionHistories: {},
  awarded: {},
  taskOutcomes: {},
  agentEconomy: createInitialAgentEconomy(mockAgents),
  agentMemories: createInitialAgentMemories(mockAgents),
  stellarPayments: {},
  stellarEscrows: {},
  isGeneratingBids: false,
  bidError: null,

  addTask: (taskInput) => {
    const task: Task = {
      ...taskInput,
      id: `task-${crypto.randomUUID()}`,
    };
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  generateBids: async (taskId) => {
    const task = get().tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    set({ isGeneratingBids: true, bidError: null });

    try {
      const response = await fetch("/api/agents/reverse-auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, agentMemories: get().agentMemories }),
      });

      if (!response.ok) {
        throw new Error("Reverse auction failed.");
      }

      const data = (await response.json()) as { auction: AuctionHistory };

      set((state) => ({
        bids: [
          ...state.bids.filter((bid) => bid.taskId !== taskId),
          ...data.auction.finalBids,
        ],
        auctionHistories: {
          ...state.auctionHistories,
          [taskId]: data.auction,
        },
        agentMemories: Object.fromEntries(
          state.agents.map((agent) => [
            agent.id,
            rememberSeenTask(state.agentMemories[agent.id], task),
          ]),
        ),
        isGeneratingBids: false,
      }));

      get().awardBid(taskId, data.auction.winningAgentId);
    } catch (error) {
      set({
        isGeneratingBids: false,
        bidError:
          error instanceof Error
            ? error.message
            : "Reverse auction failed.",
      });
    }
  },

  awardBid: (taskId, agentId) => {
    if (get().taskOutcomes[taskId]) {
      return;
    }

    const bid = get().bids.find(
      (item) => item.taskId === taskId && item.agentId === agentId,
    );
    const task = get().tasks.find((item) => item.id === taskId);
    if (!bid || !task) {
      return;
    }

    set((state) => {
      const agent = state.agents.find((item) => item.id === agentId);
      const economy = state.agentEconomy[agentId];
      if (!agent || !economy) {
        return state;
      }

      const timestamp = new Date().toISOString();
      const nextBalance = agent.balance + bid.amount;
      const nextReputation = Math.min(100, agent.reputation + 1);
      const losingAgentIds = state.bids
        .filter((item) => item.taskId === taskId && item.agentId !== agentId)
        .map((item) => item.agentId);

      return {
        awarded: { ...state.awarded, [taskId]: agentId },
        taskOutcomes: { ...state.taskOutcomes, [taskId]: "completed" },
        agents: state.agents.map((item) =>
          item.id === agentId
            ? {
                ...item,
                balance: nextBalance,
                reputation: nextReputation,
              }
            : item,
        ),
        agentEconomy: {
          ...state.agentEconomy,
          [agentId]: {
            ...economy,
            earnings: economy.earnings + bid.amount,
            completedJobs: economy.completedJobs + 1,
            balanceHistory: appendHistory(economy.balanceHistory, {
              taskId,
              taskTitle: task.title,
              timestamp,
              value: nextBalance,
              delta: bid.amount,
              reason: "Winning agent earned task payment.",
            }),
            reputationHistory: appendHistory(economy.reputationHistory, {
              taskId,
              taskTitle: task.title,
              timestamp,
              value: nextReputation,
              delta: 1,
              reason: "Winning agent gained reputation for completed work.",
            }),
            completedJobHistory: [
              ...economy.completedJobHistory,
              {
                taskId,
                taskTitle: task.title,
                amount: bid.amount,
                completedAt: timestamp,
              },
            ],
          },
        },
        agentMemories: {
          ...state.agentMemories,
          [agentId]: rememberWin(state.agentMemories[agentId], task, bid.amount),
          ...Object.fromEntries(
            losingAgentIds.map((losingAgentId) => [
              losingAgentId,
              rememberLoss(state.agentMemories[losingAgentId], task),
            ]),
          ),
        },
      };
    });
  },

  failTask: (taskId) => {
    const agentId = get().awarded[taskId];
    const task = get().tasks.find((item) => item.id === taskId);
    const currentOutcome = get().taskOutcomes[taskId];

    if (!agentId || !task || currentOutcome === "failed") {
      return;
    }

    set((state) => {
      const agent = state.agents.find((item) => item.id === agentId);
      const economy = state.agentEconomy[agentId];
      if (!agent || !economy) {
        return state;
      }

      const reputationPenalty = -3;
      const nextReputation = Math.max(
        0,
        agent.reputation + reputationPenalty,
      );

      return {
        taskOutcomes: { ...state.taskOutcomes, [taskId]: "failed" },
        agents: state.agents.map((item) =>
          item.id === agentId
            ? {
                ...item,
                reputation: nextReputation,
              }
            : item,
        ),
        agentEconomy: {
          ...state.agentEconomy,
          [agentId]: {
            ...economy,
            completedJobs:
              currentOutcome === "completed"
                ? Math.max(0, economy.completedJobs - 1)
                : economy.completedJobs,
            failedJobs: economy.failedJobs + 1,
            reputationHistory: appendHistory(economy.reputationHistory, {
              taskId,
              taskTitle: task.title,
              timestamp: new Date().toISOString(),
              value: nextReputation,
              delta: reputationPenalty,
              reason: "Failed task penalty.",
            }),
            completedJobHistory: economy.completedJobHistory.filter(
              (job) => job.taskId !== taskId,
            ),
          },
        },
        agentMemories: {
          ...state.agentMemories,
          [agentId]: rememberFailure(state.agentMemories[agentId], task),
        },
      };
    });
  },

  recordStellarPayment: (payment) => {
    set((state) => ({
      stellarPayments: {
        ...state.stellarPayments,
        [payment.taskId]: payment,
      },
    }));
  },

  recordStellarEscrow: (escrow) => {
    set((state) => ({
      stellarEscrows: {
        ...state.stellarEscrows,
        [escrow.taskId]: escrow,
      },
    }));
  },

  getBidsForTask: (taskId) =>
    get().bids.filter((bid) => bid.taskId === taskId),
}));
