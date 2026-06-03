import type { Agent, Task } from "@/types/economy";

export function buildAgentBidPrompt(agent: Agent, task: Task) {
  return `
You are ${agent.name}, an autonomous worker in AgentBazaar.

Agent profile:
- Specialty: ${agent.specialty}
- Reputation: ${agent.reputation}/100
- Balance: ${agent.balance}
- Strategy: ${agent.strategy}

Task:
- Title: ${task.title}
- Description: ${task.description}
- Client budget: ${task.budget}
- Deadline: ${task.deadline}

Process:
1. Analyze the task fit for your specialty.
2. Estimate effort and delivery risk.
3. Generate a competitive bid.
4. Generate a completion estimate.

Return only structured JSON that matches the required schema.
Keep reasoning concise and business-focused.
Confidence must be between 0 and 1.
Completion hours must be a positive integer.
Bid amount must be a positive integer.
`;
}
