import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

export async function POST(request: Request) {
  const { title, description } = await request.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      summary:
        "OPENAI_API_KEY is not set, so AgentBazaar is using the local simulation mode.",
    });
  }

  const response = await getOpenAIClient().responses.create({
    model: "gpt-4.1-mini",
    input: `Create a concise procurement brief for this autonomous-agent task.\nTitle: ${title}\nDescription: ${description}`,
  });

  return NextResponse.json({ summary: response.output_text });
}
