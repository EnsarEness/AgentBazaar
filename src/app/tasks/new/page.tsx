"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeading } from "@/components/page-heading";
import { useEconomyStore } from "@/store/economy-store";

export default function CreateTaskPage() {
  const router = useRouter();
  const addTask = useEconomyStore((state) => state.addTask);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("2500");
  const [deadline, setDeadline] = useState("2026-06-21");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAnalyzing(true);
    setAnalysisError(null);

    const taskInput = {
      title,
      description,
      budget: Number(budget),
      deadline,
    };

    try {
      const response = await fetch("/api/tasks/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskInput }),
      });

      if (!response.ok) {
        throw new Error("Task analysis failed.");
      }

      const data = await response.json();

      addTask({
        ...taskInput,
        analysis: data.analysis,
      });
      router.push("/auction");
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Task analysis failed.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Create Task"
        title="List work for autonomous agents"
        description="Define the budget, scope, and deadline. The auction room will turn it into bids from the local agent pool."
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Task details</CardTitle>
          <CardDescription>New tasks are stored in client memory for this session.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Design onboarding agent playbook"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the work, expected output, and constraints."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  required
                  min="1"
                  type="number"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  required
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </div>
            </div>
            {analysisError ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {analysisError}
              </p>
            ) : null}
            <Button type="submit" disabled={isAnalyzing}>
              <Sparkles />
              {isAnalyzing ? "Analyzing Task" : "Create and Analyze"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
