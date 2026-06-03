import type { Agent, AgentBidResponse, Bid, Task } from "@/types/economy";
import { getOpenAIClient } from "@/lib/openai";
import { buildAgentBidPrompt } from "@/lib/agents/agent-prompt";
import { agentBidJsonSchema } from "@/lib/agents/bid-schema";
import { workerAgents } from "@/lib/agents/worker-agents";

const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

function normalizeBidResponse(agent: Agent, value: AgentBidResponse) {
  return {
    agentName: agent.name,
    reasoning: String(value.reasoning || "Agent generated a market bid."),
    bidAmount: Math.max(1, Math.round(Number(value.bidAmount) || 1)),
    completionHours: Math.max(1, Math.round(Number(value.completionHours) || 1)),
    confidence: Math.min(1, Math.max(0, Number(value.confidence) || 0)),
  };
}

function fallbackBid(agent: Agent, task: Task, index: number): AgentBidResponse {
  const description = `${task.title} ${task.description}`.toLowerCase();
  const specialtyTokens = agent.specialty
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((token) => token.length > 3);
  const matchCount = specialtyTokens.filter((token) =>
    description.includes(token),
  ).length;
  const fitScore = Math.min(0.35, matchCount * 0.08);
  const reputationFactor = agent.reputation / 1000;
  const strategyFactor = 0.94 + index * 0.035 - fitScore - reputationFactor;
  const bidAmount = Math.max(300, Math.round(task.budget * strategyFactor));
  const completionHours = Math.max(
    4,
    Math.round(10 + index * 5 + (1 - fitScore) * 16 - agent.reputation / 12),
  );
  const confidence = Math.min(0.98, Math.max(0.42, 0.58 + fitScore + reputationFactor));

  return {
    agentName: agent.name,
    reasoning:
      "Local fallback estimated fit from specialty keywords, reputation, budget, and strategy because OpenAI credentials are not configured.",
    bidAmount,
    completionHours,
    confidence: Number(confidence.toFixed(2)),
  };
}

async function generateAgentBidWithOpenAI(agent: Agent, task: Task) {
  const response = await getOpenAIClient().responses.create({
    model,
    input: buildAgentBidPrompt(agent, task),
    text: {
      format: {
        type: "json_schema",
        name: "agent_bid",
        schema: agentBidJsonSchema,
        strict: true,
      },
    },
  });

  return normalizeBidResponse(agent, JSON.parse(response.output_text));
}

export async function generateAgentBid(
  agent: Agent,
  task: Task,
  index: number,
): Promise<AgentBidResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackBid(agent, task, index);
  }

  try {
    return await generateAgentBidWithOpenAI(agent, task);
  } catch {
    const fallback = fallbackBid(agent, task, index);
    return {
      ...fallback,
      reasoning: `OpenAI bid generation failed, so AgentBazaar used a local fallback estimate. ${fallback.reasoning}`,
    };
  }
}

export async function generateBidsForTask(task: Task): Promise<Bid[]> {
  const responses = await Promise.all(
    workerAgents.map((agent, index) => generateAgentBid(agent, task, index)),
  );

  return responses.map((response) => {
    const agent = workerAgents.find((item) => item.name === response.agentName);
    const agentId = agent?.id ?? response.agentName.toLowerCase().replaceAll(" ", "-");

    return {
      taskId: task.id,
      agentId,
      amount: response.bidAmount,
      estimatedCompletionTime: `${response.completionHours}h`,
      reasoning: response.reasoning,
      completionHours: response.completionHours,
      confidence: response.confidence,
    };
  });
}
