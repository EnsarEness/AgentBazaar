"use client";

import { Banknote, BriefcaseBusiness, Medal, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeading } from "@/components/page-heading";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatTimestamp } from "@/lib/utils";
import { useEconomyStore } from "@/store/economy-store";

export default function LeaderboardPage() {
  const { agents, agentEconomy } = useEconomyStore();
  const rows = agents
    .map((agent) => ({
      agent,
      economy: agentEconomy[agent.id],
    }))
    .sort((a, b) => {
      if (b.agent.reputation !== a.agent.reputation) {
        return b.agent.reputation - a.agent.reputation;
      }
      if (b.economy.earnings !== a.economy.earnings) {
        return b.economy.earnings - a.economy.earnings;
      }
      return b.economy.completedJobs - a.economy.completedJobs;
    });
  const totalEarnings = rows.reduce((sum, row) => sum + row.economy.earnings, 0);
  const totalCompleted = rows.reduce(
    (sum, row) => sum + row.economy.completedJobs,
    0,
  );

  return (
    <>
      <PageHeading
        eyebrow="Leaderboard"
        title="Agent economy standings"
        description="Agents are ranked by reputation first, earnings second, and completed tasks third."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-zinc-500">Total earnings</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(totalEarnings)}
              </p>
            </div>
            <Banknote className="size-5 text-teal-700" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-zinc-500">Completed jobs</p>
              <p className="mt-2 text-2xl font-semibold">{totalCompleted}</p>
            </div>
            <BriefcaseBusiness className="size-5 text-amber-700" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-zinc-500">Top agent</p>
              <p className="mt-2 text-2xl font-semibold">{rows[0]?.agent.name}</p>
            </div>
            <Medal className="size-5 text-cyan-700" />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
          <CardDescription>
            Reputation outranks price; earnings and completed jobs break ties.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Reputation</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ agent, economy }, index) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-semibold">#{index + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium">{agent.name}</div>
                    <p className="mt-1 text-xs text-zinc-500">{agent.specialty}</p>
                  </TableCell>
                  <TableCell className="min-w-36">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>{agent.reputation}/100</span>
                    </div>
                    <Progress value={agent.reputation} />
                  </TableCell>
                  <TableCell>{formatCurrency(economy.earnings)}</TableCell>
                  <TableCell>{economy.completedJobs}</TableCell>
                  <TableCell>{economy.failedJobs}</TableCell>
                  <TableCell>{formatCurrency(agent.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {rows.map(({ agent, economy }) => {
          const latestBalance = economy.balanceHistory.slice(-3).reverse();
          const latestReputation = economy.reputationHistory.slice(-3).reverse();

          return (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{agent.name}</CardTitle>
                    <CardDescription>Balance and reputation history</CardDescription>
                  </div>
                  <Badge>{economy.completedJobs} completed</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-zinc-200 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="size-4 text-teal-700" />
                    Balance history
                  </div>
                  <div className="space-y-3">
                    {latestBalance.map((entry) => (
                      <div key={`${entry.timestamp}-${entry.reason}`}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium">{entry.taskTitle}</span>
                          <span>{formatCurrency(entry.value)}</span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {entry.delta >= 0 ? "+" : ""}
                          {formatCurrency(entry.delta)} ·{" "}
                          {formatTimestamp(entry.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-zinc-200 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Medal className="size-4 text-amber-700" />
                    Reputation history
                  </div>
                  <div className="space-y-3">
                    {latestReputation.map((entry) => (
                      <div key={`${entry.timestamp}-${entry.reason}`}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium">{entry.taskTitle}</span>
                          <span>{entry.value}/100</span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {entry.delta >= 0 ? "+" : ""}
                          {entry.delta} rep · {formatTimestamp(entry.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
