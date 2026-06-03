"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeading } from "@/components/page-heading";
import { StellarEscrowPanel } from "@/components/stellar/stellar-escrow-panel";
import { formatCurrency } from "@/lib/utils";
import { useEconomyStore } from "@/store/economy-store";

export default function ResultsPage() {
  const {
    agents,
    tasks,
    bids,
    awarded,
    taskOutcomes,
    agentEconomy,
    stellarPayments,
    stellarEscrows,
    failTask,
    recordStellarPayment,
    recordStellarEscrow,
  } = useEconomyStore();
  const awards = Object.entries(awarded).map(([taskId, agentId]) => {
    const task = tasks.find((item) => item.id === taskId);
    const agent = agents.find((item) => item.id === agentId);
    const bid = bids.find((item) => item.taskId === taskId && item.agentId === agentId);
    const economy = agent ? agentEconomy[agent.id] : undefined;
    const outcome = taskOutcomes[taskId] ?? "completed";
    const stellarPayment = stellarPayments[taskId];
    const stellarEscrow = stellarEscrows[taskId];
    return { task, agent, bid, economy, outcome, stellarPayment, stellarEscrow };
  });

  return (
    <>
      <PageHeading
        eyebrow="Results"
        title="Soroban escrow ledger"
        description="Review awarded tasks, simulated payouts, Soroban contract deposits, and Stellar Testnet releases."
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
                  <TableHead>Confidence</TableHead>
                  <TableHead>Economy</TableHead>
                  <TableHead className="text-right">Soroban Escrow</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {awards.map(({
                  task,
                  agent,
                  bid,
                  economy,
                  outcome,
                  stellarPayment,
                  stellarEscrow,
                }) => (
                  <TableRow key={task?.id}>
                    <TableCell className="font-medium">{task?.title}</TableCell>
                    <TableCell>{agent?.name}</TableCell>
                    <TableCell>{bid ? formatCurrency(bid.amount) : "Unavailable"}</TableCell>
                    <TableCell>{bid?.estimatedCompletionTime ?? "Unavailable"}</TableCell>
                    <TableCell>
                      {bid ? `${Math.round(bid.confidence * 100)}%` : "Unavailable"}
                    </TableCell>
                    <TableCell>
                      {economy ? (
                        <span className="text-sm text-zinc-600">
                          {formatCurrency(economy.earnings)} earned,{" "}
                          {economy.completedJobs} completed
                        </span>
                      ) : (
                        "Unavailable"
                      )}
                    </TableCell>
                    <TableCell>
                      {task && agent && bid ? (
                        <StellarEscrowPanel
                          task={task}
                          agent={agent}
                          bid={bid}
                          escrow={stellarEscrow}
                          payment={stellarPayment}
                          onEscrowChange={recordStellarEscrow}
                          onPaid={recordStellarPayment}
                        />
                      ) : (
                        "Unavailable"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          outcome === "failed"
                            ? "bg-red-50 text-red-800 ring-red-100"
                            : "bg-emerald-50 text-emerald-800 ring-emerald-100"
                        }
                      >
                        {outcome === "failed" ? "Failed" : "Completed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!task || outcome === "failed"}
                        onClick={() => task && failTask(task.id)}
                      >
                        <AlertTriangle />
                        Mark Failed
                      </Button>
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
