import { generateBidsForTask } from "@/lib/agents/bid-service";
import { runJudgeAgent } from "@/lib/agents/judge-agent-service";
import { workerAgents } from "@/lib/agents/worker-agents";
import type {
  Agent,
  AuctionHistory,
  AuctionRound,
  AuctionRoundBid,
  Bid,
  Task,
} from "@/types/economy";

const auctionRoundCount = 5;

function getAgent(agentId: string) {
  return workerAgents.find((agent) => agent.id === agentId);
}

function calculateMinimumThreshold(task: Task, bid: Bid, agent: Agent) {
  const confidenceProtection = (1 - bid.confidence) * 0.1;
  const reputationEfficiency = agent.reputation / 1000;
  const floorRatio = 0.58 + confidenceProtection - reputationEfficiency;
  const effortFloor = bid.completionHours * 18;
  const budgetFloor = task.budget * Math.max(0.46, floorRatio);

  return Math.max(250, Math.round(Math.max(effortFloor, budgetFloor)));
}

function calculateWillingness(agent: Agent, confidence: number) {
  return agent.reputation / 100 * 0.55 + confidence * 0.45;
}

function createRoundOne(task: Task, bids: Bid[]): AuctionRound {
  const lowestBid = Math.min(...bids.map((bid) => bid.amount));
  const leader = bids.find((bid) => bid.amount === lowestBid) ?? bids[0];

  return {
    taskId: task.id,
    round: 1,
    lowestBid,
    leaderAgentId: leader.agentId,
    bids: bids.map((bid) => {
      const agent = getAgent(bid.agentId);
      return {
        taskId: task.id,
        round: 1,
        agentId: bid.agentId,
        agentName: agent?.name ?? bid.agentId,
        amount: bid.amount,
        previousAmount: null,
        minimumThreshold: calculateMinimumThreshold(
          task,
          bid,
          agent ?? workerAgents[0],
        ),
        completionHours: bid.completionHours,
        visibleLowest: lowestBid,
        lowered: false,
        reasoning: bid.reasoning,
        confidence: bid.confidence,
        reputation: agent?.reputation ?? 0,
      };
    }),
  };
}

function runCompetitiveRound(
  task: Task,
  previousRound: AuctionRound,
  round: number,
): AuctionRound {
  const visibleLowest = previousRound.lowestBid;
  const nextBids = previousRound.bids.map((previousBid, index) => {
    const agent = getAgent(previousBid.agentId) ?? workerAgents[index];
    const willingness = calculateWillingness(agent, previousBid.confidence);
    const bidGap = previousBid.amount - visibleLowest;
    const canCompete = previousBid.agentId !== previousRound.leaderAgentId;
    const pressure = Math.max(8, Math.round(task.budget * (0.012 + round * 0.002)));
    const reputationDiscount = Math.round(
      pressure * (agent.reputation / 100) * previousBid.confidence,
    );
    const targetAmount = visibleLowest - Math.max(5, reputationDiscount);
    const conservativeAmount = previousBid.amount - Math.max(5, Math.round(bidGap * 0.4));
    const desiredAmount =
      willingness > 0.78 ? targetAmount : Math.min(conservativeAmount, previousBid.amount);
    const amount =
      canCompete && desiredAmount >= previousBid.minimumThreshold
        ? Math.max(previousBid.minimumThreshold, desiredAmount)
        : previousBid.amount;
    const lowered = amount < previousBid.amount;
    const thresholdBlocked =
      canCompete && desiredAmount < previousBid.minimumThreshold;

    return {
      ...previousBid,
      round,
      previousAmount: previousBid.amount,
      amount,
      visibleLowest,
      lowered,
      reasoning: lowered
        ? `${agent.name} lowered its bid after seeing ${visibleLowest}, using reputation ${agent.reputation} and confidence ${Math.round(previousBid.confidence * 100)}%.`
        : thresholdBlocked
          ? `${agent.name} held at ${previousBid.amount}; lowering further would cross its minimum profitability threshold of ${previousBid.minimumThreshold}.`
          : `${agent.name} held its bid because its current position or risk profile did not justify a lower price.`,
      reputation: agent.reputation,
    };
  });
  const lowestBid = Math.min(...nextBids.map((bid) => bid.amount));
  const leader = nextBids.find((bid) => bid.amount === lowestBid) ?? nextBids[0];

  return {
    taskId: task.id,
    round,
    lowestBid,
    leaderAgentId: leader.agentId,
    bids: nextBids,
  };
}

function toFinalBid(roundBid: AuctionRoundBid): Bid {
  return {
    taskId: roundBid.taskId,
    agentId: roundBid.agentId,
    amount: roundBid.amount,
    estimatedCompletionTime: `${roundBid.completionHours}h`,
    reasoning: roundBid.reasoning,
    completionHours: roundBid.completionHours,
    confidence: roundBid.confidence,
  };
}

export async function runReverseAuction(task: Task): Promise<AuctionHistory> {
  const initialBids = await generateBidsForTask(task);
  const rounds: AuctionRound[] = [createRoundOne(task, initialBids)];

  for (let round = 2; round <= auctionRoundCount; round += 1) {
    rounds.push(runCompetitiveRound(task, rounds[rounds.length - 1], round));
  }

  const finalRound = rounds[rounds.length - 1];
  const finalBids = finalRound.bids.map(toFinalBid);
  const judgeReport = runJudgeAgent(task, finalBids);
  const winner =
    finalBids.find((bid) => bid.agentId === judgeReport.selectedAgentId) ??
    finalBids[0];

  return {
    taskId: task.id,
    rounds,
    finalBids,
    winningAgentId: judgeReport.selectedAgentId,
    winningBid: winner.amount,
    judgeReport,
  };
}
