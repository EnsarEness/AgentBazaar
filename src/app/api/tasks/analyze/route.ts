import { NextResponse } from "next/server";
import { analyzeTask } from "@/lib/tasks/task-analysis-service";
import type { Task } from "@/types/economy";

type TaskAnalysisInput = Omit<Task, "id">;

function isTaskInput(value: Partial<Task>): value is TaskAnalysisInput {
  return Boolean(
    value.title &&
      value.description &&
      typeof value.budget === "number" &&
      value.deadline,
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const task = body.task as Partial<Task>;

  if (!isTaskInput(task)) {
    return NextResponse.json(
      { error: "Title, description, budget, and deadline are required." },
      { status: 400 },
    );
  }

  const analysis = await analyzeTask({
    title: task.title,
    description: task.description,
    budget: task.budget,
    deadline: task.deadline,
    analysis: task.analysis,
  });

  return NextResponse.json({ analysis });
}
