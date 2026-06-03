"use client";

import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeading } from "@/components/page-heading";
import { formatCurrency } from "@/lib/utils";
import { useEconomyStore } from "@/store/economy-store";

export default function ResultsPage() {
  const { agents, tasks, bids, awarded } = useEconomyStore();
  const awards = Object.entries(awarded).map(([taskId, agentId]) => {
    const task = tasks.find((item) => item.id === taskId);
    const agent = agents.find((item) => item.id === agentId);
    const bid = bids.find((item) => item.taskId === taskId && item.agentId === agentId);
    return { task, agent, bid };
  });

  return (
    <>
      <PageHeading
        eyebrow="Results"
        title="Settlement ledger"
        description="Review awarded tasks, winning bids, and the resulting simulated agent payouts."
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Winning contracts</CardTitle>
            <CardDescription>Each award updates the winner balance and reputation.</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/auction">
              Open Auction
              <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {awards.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 text-center">
              <Trophy className="size-10 text-amber-700" />
              <p className="mt-3 font-medium">No contracts awarded yet</p>
              <p className="mt-1 text-sm text-zinc-500">
                Generate bids and award a task to populate the ledger.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead>Bid</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {awards.map(({ task, agent, bid }) => (
                  <TableRow key={task?.id}>
                    <TableCell className="font-medium">{task?.title}</TableCell>
                    <TableCell>{agent?.name}</TableCell>
                    <TableCell>{bid ? formatCurrency(bid.amount) : "Unavailable"}</TableCell>
                    <TableCell>{bid?.estimatedCompletionTime ?? "Unavailable"}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-50 text-emerald-800 ring-emerald-100">
                        Settled
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
