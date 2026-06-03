"use client";

import { Banknote, Brain, History, Medal, Trophy, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeading } from "@/components/page-heading";
import { formatCurrency } from "@/lib/utils";
import { useEconomyStore } from "@/store/economy-store";

export default function AgentsPage() {
  const { agents, agentMemories } = useEconomyStore();

  return (
    <>
      <PageHeading
        eyebrow="Agents"
        title="Autonomous supplier network"
        description="Five simulated agents compete on cost, speed, specialty fit, and reputation."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{agent.name}</CardTitle>
                  <CardDescription className="mt-2">{agent.specialty}</CardDescription>
                </div>
                <Badge>{agent.id.replace("agent-", "")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Strategy
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  {agent.strategy}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
                <span className="flex items-center gap-2 text-sm text-zinc-500">
                  <Banknote className="size-4 text-teal-700" />
                  Balance
                </span>
                <span className="font-semibold">{formatCurrency(agent.balance)}</span>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-500">
                    <Medal className="size-4 text-amber-700" />
                    Reputation
                  </span>
                  <span className="font-semibold">{agent.reputation}/100</span>
                </div>
                <Progress value={agent.reputation} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Agent memory panel</CardTitle>
              <CardDescription>
                Each worker remembers prior tasks, wins, losses, and preferred task categories.
              </CardDescription>
            </div>
            <div className="flex size-11 items-center justify-center rounded-md bg-cyan-100 text-cyan-800">
              <Brain className="size-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-2">
            {agents.map((agent) => {
              const memory = agentMemories[agent.id];
              const preferredCategories = Object.entries(
                memory.preferredTaskCategories,
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

              return (
                <div
                  key={`${agent.id}-memory`}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-semibold">{agent.name}</h2>
                      <p className="mt-1 text-sm text-zinc-500">{agent.specialty}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-white text-zinc-700 ring-zinc-200">
                        {memory.previousTasks.length} tasks
                      </Badge>
                      <Badge className="bg-emerald-50 text-emerald-800 ring-emerald-100">
                        {memory.previousWins.length} wins
                      </Badge>
                      <Badge className="bg-red-50 text-red-800 ring-red-100">
                        {memory.previousLosses.length} losses
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                        <Trophy className="size-4 text-emerald-700" />
                        Preferred categories
                      </div>
                      {preferredCategories.length === 0 ? (
                        <p className="text-sm text-zinc-500">
                          No learned preferences yet.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {preferredCategories.map(([category, count]) => (
                            <Badge
                              key={category}
                              className="bg-cyan-50 text-cyan-800 ring-cyan-100"
                            >
                              {category} x{count}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                        <History className="size-4 text-amber-700" />
                        Recent memory
                      </div>
                      <div className="space-y-2">
                        {memory.memoryNotes.slice(0, 3).map((note) => (
                          <p
                            key={note}
                            className="text-xs leading-5 text-zinc-600"
                          >
                            {note}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        <Trophy className="size-3.5" />
                        Previous wins
                      </div>
                      <div className="space-y-2">
                        {memory.previousWins.length === 0 ? (
                          <p className="text-sm text-zinc-500">No wins yet.</p>
                        ) : (
                          memory.previousWins.slice(0, 3).map((win) => (
                            <div
                              key={`${win.taskId}-win`}
                              className="rounded-md bg-white px-3 py-2 text-sm ring-1 ring-zinc-200"
                            >
                              <p className="font-medium">{win.taskTitle}</p>
                              <p className="mt-1 text-xs text-zinc-500">
                                {win.categories.join(", ")}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        <XCircle className="size-3.5" />
                        Previous losses
                      </div>
                      <div className="space-y-2">
                        {memory.previousLosses.length === 0 ? (
                          <p className="text-sm text-zinc-500">No losses yet.</p>
                        ) : (
                          memory.previousLosses.slice(0, 3).map((loss) => (
                            <div
                              key={`${loss.taskId}-loss`}
                              className="rounded-md bg-white px-3 py-2 text-sm ring-1 ring-zinc-200"
                            >
                              <p className="font-medium">{loss.taskTitle}</p>
                              <p className="mt-1 text-xs text-zinc-500">
                                {loss.outcome} · {loss.categories.join(", ")}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
