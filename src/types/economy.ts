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
