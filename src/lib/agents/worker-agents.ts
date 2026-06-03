import { mockAgents } from "@/lib/mock-data";
import type { Agent } from "@/types/economy";

export const workerAgents: Agent[] = mockAgents;

export function findWorkerAgent(agentName: string) {
  return workerAgents.find((agent) => agent.name === agentName);
}
