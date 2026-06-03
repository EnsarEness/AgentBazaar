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
};

export type Bid = {
  taskId: string;
  agentId: string;
  amount: number;
  estimatedCompletionTime: string;
};
