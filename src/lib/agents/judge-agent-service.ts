import { workerAgents } from "@/lib/agents/worker-agents";
import type {
  Agent,
  Bid,
  JudgeEvaluation,
  JudgeReport,
  JudgeScoreBreakdown,
  JudgeWeights,
  Task,
} from "@/types/economy";

export const judgeWeights: JudgeWeights = {
  quality: 0.4,
  reputation: 0.3,
  price: 0.2,
  completionTime: 0.1,
};

function clampScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function getAgent(agentId: string) {
  return workerAgents.find((agent) => agent.id === agentId);
}

function getTaskFit(task: Task, agent: Agent) {
  const taskText = `${task.title} ${task.description}`.toLowerCase();
  const agentTerms = `${agent.specialty} ${agent.strategy}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 4);
  const matches = agentTerms.filter((term) => taskText.includes(term)).length;

  return Math.min(1, matches / 4);
}

function calculateScores({
  task,
  bid,
  agent,
  lowestBid,
  fastestCompletion,
}: {
  task: Task;
  bid: Bid;
  agent: Agent;
  lowestBid: number;
  fastestCompletion: number;
}): JudgeScoreBreakdown {
  const taskFit = getTaskFit(task, agent);

  return {
    quality: clampScore(bid.confidence * 85 + taskFit * 15),
    reputation: clampScore(agent.reputation),
    price: clampScore((lowestBid / bid.amount) * 100),
    completionTime: clampScore((fastestCompletion / bid.completionHours) * 100),
  };
}

function calculateTotalScore(scores: JudgeScoreBreakdown) {
  return Number(
    (
      scores.quality * judgeWeights.quality +
      scores.reputation * judgeWeights.reputation +
      scores.price * judgeWeights.price +
      scores.completionTime * judgeWeights.completionTime
    ).toFixed(2),
  );
}

function explainEvaluation(agent: Agent, bid: Bid, scores: JudgeScoreBreakdown) {
  return `${agent.name} scored ${calculateTotalScore(scores)} with quality ${scores.quality}, reputation ${scores.reputation}, price ${scores.price}, and completion time ${scores.completionTime}. Its bid was ${bid.amount} with ${Math.round(bid.confidence * 100)}% confidence and ${bid.completionHours}h estimated completion.`;
}

export function runJudgeAgent(task: Task, bids: Bid[]): JudgeReport {
  const lowestBid = Math.min(...bids.map((bid) => bid.amount));
  const fastestCompletion = Math.min(...bids.map((bid) => bid.completionHours));
  const cheapestBid = bids.find((bid) => bid.amount === lowestBid) ?? bids[0];
  const cheapestAgent = getAgent(cheapestBid.agentId);
  const evaluations: JudgeEvaluation[] = bids
    .map((bid) => {
      const agent = getAgent(bid.agentId);
      if (!agent) {
        throw new Error(`Missing agent for bid ${bid.agentId}`);
      }

      const scores = calculateScores({
        task,
        bid,
        agent,
        lowestBid,
        fastestCompletion,
      });

      return {
        agentId: agent.id,
        agentName: agent.name,
        bidAmount: bid.amount,
        reputation: agent.reputation,
        confidence: bid.confidence,
        completionHours: bid.completionHours,
        scores,
        totalScore: calculateTotalScore(scores),
        explanation: explainEvaluation(agent, bid, scores),
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  const winner = evaluations[0];
  const winnerIsCheapest = winner.agentId === cheapestBid.agentId;

  return {
    taskId: task.id,
    selectedAgentId: winner.agentId,
    selectedAgentName: winner.agentName,
    explanation: `${winner.agentName} selected because it produced the strongest weighted score (${winner.totalScore}) across quality, reputation, price, and completion time. ${winnerIsCheapest ? "It also had the cheapest bid, but price only contributed 20% of the decision." : `It was selected over the cheapest bid from ${cheapestAgent?.name ?? cheapestBid.agentId} because quality, reputation, and delivery timing outweighed pure price.`}`,
    cheapestAgentId: cheapestBid.agentId,
    cheapestAgentName: cheapestAgent?.name ?? cheapestBid.agentId,
    cheapestBid: cheapestBid.amount,
    weights: judgeWeights,
    evaluations,
  };
}
