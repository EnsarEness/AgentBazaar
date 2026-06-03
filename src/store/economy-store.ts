"use client";

import { create } from "zustand";
import { mockAgents, seedTasks } from "@/lib/mock-data";
import type { Agent, AuctionHistory, Bid, Task } from "@/types/economy";

type EconomyState = {
  agents: Agent[];
  tasks: Task[];
  bids: Bid[];
  auctionHistories: Record<string, AuctionHistory>;
  awarded: Record<string, string>;
  isGeneratingBids: boolean;
  bidError: string | null;
  addTask: (task: Omit<Task, "id">) => Task;
  generateBids: (taskId: string) => Promise<void>;
  awardBid: (taskId: string, agentId: string) => void;
  getBidsForTask: (taskId: string) => Bid[];
};

export const useEconomyStore = create<EconomyState>((set, get) => ({
  agents: mockAgents,
  tasks: seedTasks,
  bids: [],
  auctionHistories: {},
  awarded: {},
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
    const bid = get().bids.find(
      (item) => item.taskId === taskId && item.agentId === agentId,
    );
    if (!bid) {
      return;
    }

    set((state) => ({
      awarded: { ...state.awarded, [taskId]: agentId },
      agents: state.agents.map((agent) =>
        agent.id === agentId
          ? {
              ...agent,
              balance: agent.balance + bid.amount,
              reputation: Math.min(100, agent.reputation + 1),
            }
          : agent,
      ),
    }));
  },

  getBidsForTask: (taskId) =>
    get().bids.filter((bid) => bid.taskId === taskId),
}));
