import { getOpenAIClient } from "@/lib/openai";
import { taskAnalysisJsonSchema } from "@/lib/tasks/task-analysis-schema";
import type { Task, TaskAnalysis, TaskComplexity } from "@/types/economy";

const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

const complexityOrder: TaskComplexity[] = ["Low", "Medium", "High", "Critical"];

function normalizeTaskAnalysis(value: TaskAnalysis): TaskAnalysis {
  const complexity = complexityOrder.includes(value.expectedComplexity)
    ? value.expectedComplexity
    : "Medium";

  const skills = (value.skillsRequired || [])
    .map((skill) => String(skill))
    .filter(Boolean)
    .slice(0, 8);
  const logs = (value.reasoningLogs || [])
    .map((log) => String(log))
    .filter(Boolean)
    .slice(0, 6);

  return {
    analysis: String(value.analysis || "Task requires scoped agent execution."),
    expectedComplexity: complexity,
    complexityScore: Math.min(
      100,
      Math.max(1, Math.round(Number(value.complexityScore) || 50)),
    ),
    skillsRequired: skills.length > 0 ? skills : ["Task planning"],
    reasoningLogs:
      logs.length > 0 ? logs : ["Generated a structured task analysis."],
  };
}

export function fallbackTaskAnalysis(task: Omit<Task, "id">): TaskAnalysis {
  const text = `${task.title} ${task.description}`.toLowerCase();
  const skills = [
    text.includes("api") || text.includes("backend") ? "Backend engineering" : "",
    text.includes("ui") || text.includes("frontend") ? "Frontend engineering" : "",
    text.includes("test") || text.includes("qa") ? "Testing and QA" : "",
    text.includes("research") || text.includes("competitor") ? "Research synthesis" : "",
    text.includes("deploy") || text.includes("ci") ? "DevOps" : "",
  ].filter(Boolean);
  const descriptionLength = task.description.length;
  const expectedComplexity: TaskComplexity =
    task.budget > 7000 || descriptionLength > 500
      ? "High"
      : task.budget > 3500 || descriptionLength > 220
        ? "Medium"
        : "Low";

  return {
    analysis:
      "Local fallback analysis created from task scope, budget, and keyword signals.",
    expectedComplexity,
    complexityScore:
      expectedComplexity === "High" ? 78 : expectedComplexity === "Medium" ? 55 : 32,
    skillsRequired: skills.length > 0 ? skills : ["Task planning", "Agent execution"],
    reasoningLogs: [
      "Parsed title and description for domain signals.",
      "Estimated complexity from budget and scope detail.",
      "Mapped detected work areas to likely worker-agent skills.",
    ],
  };
}

export async function analyzeTask(
  task: Omit<Task, "id">,
): Promise<TaskAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackTaskAnalysis(task);
  }

  try {
    const response = await getOpenAIClient().responses.create({
      model,
      input: `
Analyze this AgentBazaar task before worker agents bid.

Task:
- Title: ${task.title}
- Description: ${task.description}
- Budget: ${task.budget}
- Deadline: ${task.deadline}

Return structured JSON only.
The analysis should identify the work implied by the task.
Expected complexity must reflect scope, ambiguity, delivery risk, and budget.
Skills required should be concise capability labels worker agents can use while bidding.
Reasoning logs should be short UI-readable steps, not hidden chain-of-thought.
`,
      text: {
        format: {
          type: "json_schema",
          name: "task_analysis",
          schema: taskAnalysisJsonSchema,
          strict: true,
        },
      },
    });

    return normalizeTaskAnalysis(JSON.parse(response.output_text));
  } catch {
    const fallback = fallbackTaskAnalysis(task);
    return {
      ...fallback,
      reasoningLogs: [
        "OpenAI task analysis failed, so AgentBazaar used local fallback analysis.",
        ...fallback.reasoningLogs,
      ].slice(0, 6),
    };
  }
}
