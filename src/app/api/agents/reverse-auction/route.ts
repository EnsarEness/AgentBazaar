import { NextResponse } from "next/server";
import { runReverseAuction } from "@/lib/agents/reverse-auction-service";
import type { AgentMemory, Task } from "@/types/economy";

function isTask(value: Partial<Task>): value is Task {
  return Boolean(
    value.id &&
      value.title &&
      value.description &&
      typeof value.budget === "number" &&
      value.deadline,
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const task = body.task as Partial<Task>;
  const agentMemories = body.agentMemories as
    | Record<string, AgentMemory>
    | undefined;

  if (!isTask(task)) {
    return NextResponse.json(
      { error: "A complete task is required to run a reverse auction." },
      { status: 400 },
    );
  }

  const auction = await runReverseAuction(task, agentMemories);

  return NextResponse.json({ auction });
}
