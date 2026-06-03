"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Gavel, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeading } from "@/components/page-heading";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useEconomyStore } from "@/store/economy-store";

export default function AuctionPage() {
  const { agents, tasks, bids, awarded, generateBids, awardBid } = useEconomyStore();
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id ?? "");
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId),
    [tasks, selectedTaskId],
  );
  const taskBids = bids
    .filter((bid) => bid.taskId === selectedTaskId)
    .sort((a, b) => a.amount - b.amount);

  return (
    <>
      <PageHeading
        eyebrow="Auction"
        title="Run the agent market"
        description="Select a task, generate simulated bids, and award the contract to the best-fit agent."
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Task for auction</CardTitle>
            <CardDescription>Choose which task enters the marketplace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              value={selectedTaskId}
              onChange={(event) => setSelectedTaskId(event.target.value)}
            >
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>

            {selectedTask ? (
              <div className="rounded-lg border border-zinc-200 p-4">
                <h2 className="font-semibold">{selectedTask.title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {selectedTask.description}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-zinc-500">Budget</p>
                    <p className="font-semibold">{formatCurrency(selectedTask.budget)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Deadline</p>
                    <p className="font-semibold">{formatDate(selectedTask.deadline)}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <Button
              className="w-full"
              disabled={!selectedTask}
              onClick={() => generateBids(selectedTaskId)}
            >
              <RefreshCw />
              Generate Bids
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bid board</CardTitle>
            <CardDescription>Lowest qualified bid appears first.</CardDescription>
          </CardHeader>
          <CardContent>
            {taskBids.length === 0 ? (
              <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-center text-sm text-zinc-500">
                Generate bids to open the market for this task.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Bid</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskBids.map((bid) => {
                    const agent = agents.find((item) => item.id === bid.agentId);
                    const isAwarded = awarded[bid.taskId] === bid.agentId;
                    return (
                      <TableRow key={`${bid.taskId}-${bid.agentId}`}>
                        <TableCell className="font-medium">{agent?.name}</TableCell>
                        <TableCell className="text-zinc-600">{agent?.specialty}</TableCell>
                        <TableCell>{formatCurrency(bid.amount)}</TableCell>
                        <TableCell>{bid.estimatedCompletionTime}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={isAwarded ? "secondary" : "default"}
                            onClick={() => awardBid(bid.taskId, bid.agentId)}
                          >
                            {isAwarded ? <CheckCircle2 /> : <Gavel />}
                            {isAwarded ? "Awarded" : "Award"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
