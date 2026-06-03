import type {
  Agent,
  AgentBidResponse,
  AgentMemory,
  Bid,
  Task,
} from "@/types/economy";
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

function getTaskCategoryText(task: Task) {
  return [
    task.title,
    task.description,
    task.analysis?.analysis ?? "",
    ...(task.analysis?.skillsRequired ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function getMemoryMatch(memory: AgentMemory | undefined, task: Task) {
  if (!memory) {
    return {
      preferredHits: 0,
      similarWins: 0,
      similarLosses: 0,
      matchedCategories: [] as string[],
    };
  }

  const taskText = getTaskCategoryText(task);
  const matchedCategories = Object.keys(memory.preferredTaskCategories).filter(
    (category) => {
      const normalized = category.toLowerCase();
      return taskText.includes(normalized) || normalized.includes(taskText);
    },
  );
  const taskSkills = task.analysis?.skillsRequired.map((skill) => skill.toLowerCase()) ?? [];
  const hasOverlap = (categories: string[]) =>
    categories.some((category) => {
      const normalized = category.toLowerCase();
      return (
        taskText.includes(normalized) ||
        taskSkills.some(
          (skill) => skill.includes(normalized) || normalized.includes(skill),
        )
      );
    });

  return {
    preferredHits: matchedCategories.reduce(
      (sum, category) => sum + (memory.preferredTaskCategories[category] ?? 0),
      0,
    ),
    similarWins: memory.previousWins.filter((taskMemory) =>
      hasOverlap(taskMemory.categories),
    ).length,
    similarLosses: memory.previousLosses.filter((taskMemory) =>
      hasOverlap(taskMemory.categories),
    ).length,
    matchedCategories,
  };
}

function applyMemoryInfluence(
  bid: AgentBidResponse,
  task: Task,
  memory?: AgentMemory,
) {
  const match = getMemoryMatch(memory, task);
  const positiveInfluence = Math.min(
    0.18,
    match.preferredHits * 0.015 + match.similarWins * 0.03,
  );
  const negativeInfluence = Math.min(0.12, match.similarLosses * 0.025);
  const confidenceDelta = positiveInfluence - negativeInfluence;
  const bidMultiplier = 1 - positiveInfluence * 0.3 + negativeInfluence * 0.25;
  const completionMultiplier = 1 - positiveInfluence * 0.2 + negativeInfluence * 0.1;
  const memoryReason =
    positiveInfluence > negativeInfluence
      ? `Memory increased confidence from ${match.similarWins} similar wins and preferred categories ${match.matchedCategories.join(", ") || "related skills"}.`
      : negativeInfluence > 0
        ? `Memory made the agent more conservative after ${match.similarLosses} similar losses or failures.`
        : "Memory found no strong prior pattern for this task.";

  return {
    ...bid,
    reasoning: `${bid.reasoning} ${memoryReason}`,
    bidAmount: Math.max(1, Math.round(bid.bidAmount * bidMultiplier)),
    completionHours: Math.max(
      1,
      Math.round(bid.completionHours * completionMultiplier),
    ),
    confidence: Number(
      Math.min(1, Math.max(0, bid.confidence + confidenceDelta)).toFixed(2),
    ),
  };
}

function fallbackBid(
  agent: Agent,
  task: Task,
  index: number,
  memory?: AgentMemory,
): AgentBidResponse {
  const description = `${task.title} ${task.description}`.toLowerCase();
  const analysisSkills = task.analysis?.skillsRequired.join(" ").toLowerCase() ?? "";
  const specialtyTokens = agent.specialty
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((token) => token.length > 3);
  const matchCount = specialtyTokens.filter((token) =>
    description.includes(token) || analysisSkills.includes(token),
  ).length;
  const complexityMultiplier =
    task.analysis?.expectedComplexity === "Critical"
      ? 1.18
      : task.analysis?.expectedComplexity === "High"
        ? 1.1
        : task.analysis?.expectedComplexity === "Medium"
          ? 1.04
          : 0.96;
  const memoryMatch = getMemoryMatch(memory, task);
  const fitScore = Math.min(
    0.42,
    matchCount * 0.08 + memoryMatch.similarWins * 0.025,
  );
  const reputationFactor = agent.reputation / 1000;
  const strategyFactor =
    (0.94 + index * 0.035 - fitScore - reputationFactor) *
    complexityMultiplier;
  const bidAmount = Math.max(300, Math.round(task.budget * strategyFactor));
  const completionHours = Math.max(
    4,
    Math.round(10 + index * 5 + (1 - fitScore) * 16 - agent.reputation / 12),
  );
  const confidence = Math.min(0.98, Math.max(0.42, 0.58 + fitScore + reputationFactor));

  return applyMemoryInfluence(
    {
    agentName: agent.name,
    reasoning:
      "Local fallback estimated fit from task analysis, specialty keywords, reputation, budget, and strategy because OpenAI credentials are not configured.",
    bidAmount,
    completionHours,
    confidence: Number(confidence.toFixed(2)),
    },
    task,
    memory,
  );
}

async function generateAgentBidWithOpenAI(
  agent: Agent,
  task: Task,
  memory?: AgentMemory,
) {
  const response = await getOpenAIClient().responses.create({
    model,
    input: buildAgentBidPrompt(agent, task, memory),
    text: {
      format: {
        type: "json_schema",
        name: "agent_bid",
        schema: agentBidJsonSchema,
        strict: true,
      },
    },
  });

  return applyMemoryInfluence(
    normalizeBidResponse(agent, JSON.parse(response.output_text)),
    task,
    memory,
  );
}

export async function generateAgentBid(
  agent: Agent,
  task: Task,
  index: number,
  memory?: AgentMemory,
): Promise<AgentBidResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackBid(agent, task, index, memory);
  }

  try {
    return await generateAgentBidWithOpenAI(agent, task, memory);
  } catch {
    const fallback = fallbackBid(agent, task, index, memory);
    return {
      ...fallback,
      reasoning: `OpenAI bid generation failed, so AgentBazaar used a local fallback estimate. ${fallback.reasoning}`,
    };
  }
}

export async function generateBidsForTask(
  task: Task,
  agentMemories?: Record<string, AgentMemory>,
): Promise<Bid[]> {
  const responses = await Promise.all(
    workerAgents.map((agent, index) =>
      generateAgentBid(agent, task, index, agentMemories?.[agent.id]),
    ),
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
