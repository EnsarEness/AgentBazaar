import { NextResponse } from "next/server";
import { generateBidsForTask } from "@/lib/agents/bid-service";
import type { Task } from "@/types/economy";

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

  if (!isTask(task)) {
    return NextResponse.json(
      { error: "A complete task is required to generate agent bids." },
      { status: 400 },
    );
  }

  const bids = await generateBidsForTask(task);

  return NextResponse.json({ bids });
}
