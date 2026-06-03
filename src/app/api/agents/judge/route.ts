import { NextResponse } from "next/server";
import { runJudgeAgent } from "@/lib/agents/judge-agent-service";
import type { Bid, Task } from "@/types/economy";

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
  const bids = body.bids as Bid[];

  if (!isTask(task) || !Array.isArray(bids) || bids.length === 0) {
    return NextResponse.json(
      { error: "A task and at least one bid are required for judge evaluation." },
      { status: 400 },
    );
  }

  const report = runJudgeAgent(task, bids);

  return NextResponse.json({ report });
}
