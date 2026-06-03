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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addTask({
      title,
      description,
      budget: Number(budget),
      deadline,
    });
    router.push("/auction");
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
            <Button type="submit">
              <Sparkles />
              Create and Auction
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
