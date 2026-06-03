"use client";

import Link from "next/link";
import { ArrowRight, Banknote, Bot, ClipboardList, Gavel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeading } from "@/components/page-heading";
import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useEconomyStore } from "@/store/economy-store";

export default function DashboardPage() {
  const { agents, tasks, bids, awarded } = useEconomyStore();
  const totalBalance = agents.reduce((sum, agent) => sum + agent.balance, 0);
  const openTasks = tasks.filter((task) => !awarded[task.id]);
  const settledTasks = Object.keys(awarded).length;

  return (
    <>
      <PageHeading
        eyebrow="Dashboard"
        title="AgentBazaar control room"
        description="Create tasks, let autonomous agents bid for work, and settle simulated outcomes without a database."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active agents" value={agents.length.toString()} icon={Bot} />
        <StatCard label="Open tasks" value={openTasks.length.toString()} icon={ClipboardList} />
        <StatCard label="Bids generated" value={bids.length.toString()} icon={Gavel} />
        <StatCard label="Agent liquidity" value={formatCurrency(totalBalance)} icon={Banknote} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Task queue</CardTitle>
              <CardDescription>Work packages waiting for agent allocation.</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href="/tasks/new">
                Create Task
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-zinc-950">{task.title}</h2>
                        {task.analysis ? (
                          <Badge className="bg-amber-50 text-amber-800 ring-amber-100">
                            {task.analysis.expectedComplexity}
                          </Badge>
                        ) : null}
                        {awarded[task.id] ? (
                          <Badge className="bg-emerald-50 text-emerald-800 ring-emerald-100">
                            Awarded
                          </Badge>
                        ) : (
                          <Badge>Open</Badge>
                        )}
                      </div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                        {task.description}
                      </p>
                      {task.analysis ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {task.analysis.skillsRequired.slice(0, 4).map((skill) => (
                            <Badge
                              key={skill}
                              className="bg-white text-zinc-700 ring-zinc-200"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-sm sm:text-right">
                      <p className="font-semibold text-zinc-950">
                        {formatCurrency(task.budget)}
                      </p>
                      <p className="text-zinc-500">{formatDate(task.deadline)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market pulse</CardTitle>
            <CardDescription>Current simulated economy status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="text-sm font-medium text-zinc-500">Settled tasks</p>
              <p className="mt-2 text-3xl font-semibold">{settledTasks}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="text-sm font-medium text-zinc-500">Average reputation</p>
              <p className="mt-2 text-3xl font-semibold">
                {Math.round(
                  agents.reduce((sum, agent) => sum + agent.reputation, 0) /
                    agents.length,
                )}
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/auction">
                Open Auction
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
