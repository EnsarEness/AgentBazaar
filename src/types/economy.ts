export type Task = {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
};

export type Agent = {
  id: string;
  name: string;
  specialty: string;
  balance: number;
  reputation: number;
  strategy: string;
};

export type Bid = {
  taskId: string;
  agentId: string;
  amount: number;
  estimatedCompletionTime: string;
  reasoning: string;
  completionHours: number;
  confidence: number;
};

export type AgentBidResponse = {
  agentName: string;
  reasoning: string;
  bidAmount: number;
  completionHours: number;
  confidence: number;
};

export type AuctionRoundBid = {
  taskId: string;
  round: number;
  agentId: string;
  agentName: string;
  amount: number;
  previousAmount: number | null;
  minimumThreshold: number;
  completionHours: number;
  visibleLowest: number;
  lowered: boolean;
  reasoning: string;
  confidence: number;
  reputation: number;
};

export type AuctionRound = {
  taskId: string;
  round: number;
  lowestBid: number;
  leaderAgentId: string;
  bids: AuctionRoundBid[];
};

export type JudgeWeights = {
  quality: number;
  reputation: number;
  price: number;
  completionTime: number;
};

export type JudgeScoreBreakdown = {
  quality: number;
  reputation: number;
  price: number;
  completionTime: number;
};

export type JudgeEvaluation = {
  agentId: string;
  agentName: string;
  bidAmount: number;
  reputation: number;
  confidence: number;
  completionHours: number;
  scores: JudgeScoreBreakdown;
  totalScore: number;
  explanation: string;
};

export type JudgeReport = {
  taskId: string;
  selectedAgentId: string;
  selectedAgentName: string;
  explanation: string;
  cheapestAgentId: string;
  cheapestAgentName: string;
  cheapestBid: number;
  weights: JudgeWeights;
  evaluations: JudgeEvaluation[];
};

export type AuctionHistory = {
  taskId: string;
  rounds: AuctionRound[];
  finalBids: Bid[];
  winningAgentId: string;
  winningBid: number;
  judgeReport: JudgeReport;
};
