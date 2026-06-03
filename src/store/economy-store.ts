"use client";

import { create } from "zustand";
import { mockAgents, seedTasks } from "@/lib/mock-data";
import type { Agent, Bid, Task } from "@/types/economy";

type EconomyState = {
  agents: Agent[];
  tasks: Task[];
  bids: Bid[];
  awarded: Record<string, string>;
  addTask: (task: Omit<Task, "id">) => Task;
  generateBids: (taskId: string) => void;
  awardBid: (taskId: string, agentId: string) => void;
  getBidsForTask: (taskId: string) => Bid[];
};

const hourOptions = [8, 12, 18, 24, 36];

function quoteForAgent(agent: Agent, task: Task, index: number): Bid {
  const fit =
    agent.specialty.toLowerCase().includes("automation") &&
    task.description.toLowerCase().includes("agent")
      ? 0.82
      : 0.9 + index * 0.04;
  const reputationDiscount = (100 - agent.reputation) / 250;
  const amount = Math.max(
    250,
    Math.round(task.budget * (fit + reputationDiscount) - index * 75),
  );

  return {
    taskId: task.id,
    agentId: agent.id,
    amount,
    estimatedCompletionTime: `${hourOptions[index] ?? 48}h`,
  };
}

export const useEconomyStore = create<EconomyState>((set, get) => ({
  agents: mockAgents,
  tasks: seedTasks,
  bids: [],
  awarded: {},

  addTask: (taskInput) => {
    const task: Task = {
      ...taskInput,
      id: `task-${crypto.randomUUID()}`,
    };
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  generateBids: (taskId) => {
    const task = get().tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    const bids = get().agents.map((agent, index) =>
      quoteForAgent(agent, task, index),
    );

    set((state) => ({
      bids: [...state.bids.filter((bid) => bid.taskId !== taskId), ...bids],
    }));
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
