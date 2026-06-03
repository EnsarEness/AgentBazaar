"use client";

import { create } from "zustand";
import { mockAgents, seedTasks } from "@/lib/mock-data";
import type {
  Agent,
  AgentEconomy,
  AuctionHistory,
  Bid,
  EconomyHistoryEntry,
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
  isGeneratingBids: boolean;
  bidError: string | null;
  addTask: (task: Omit<Task, "id">) => Task;
  generateBids: (taskId: string) => Promise<void>;
  awardBid: (taskId: string, agentId: string) => void;
  failTask: (taskId: string) => void;
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

function appendHistory(
  history: EconomyHistoryEntry[],
  entry: EconomyHistoryEntry,
) {
  return [...history, entry];
}

export const useEconomyStore = create<EconomyState>((set, get) => ({
  agents: mockAgents,
  tasks: seedTasks,
  bids: [],
  auctionHistories: {},
  awarded: {},
  taskOutcomes: {},
  agentEconomy: createInitialAgentEconomy(mockAgents),
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
        body: JSON.stringify({ task }),
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
        isGeneratingBids: false,
      }));
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
      };
    });
  },

  getBidsForTask: (taskId) =>
    get().bids.filter((bid) => bid.taskId === taskId),
}));
