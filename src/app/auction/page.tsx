"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Gavel, RefreshCw, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeading } from "@/components/page-heading";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useEconomyStore } from "@/store/economy-store";

export default function AuctionPage() {
  const {
    agents,
    tasks,
    bids,
    auctionHistories,
    awarded,
    taskOutcomes,
    isGeneratingBids,
    bidError,
    generateBids,
    awardBid,
  } = useEconomyStore();
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id ?? "");
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId),
    [tasks, selectedTaskId],
  );
  const taskBids = bids
    .filter((bid) => bid.taskId === selectedTaskId)
    .sort((a, b) => a.amount - b.amount);
  const auctionHistory = auctionHistories[selectedTaskId];
  const judgeReport = auctionHistory?.judgeReport;

  return (
    <>
      <PageHeading
        eyebrow="Auction"
        title="Run autonomous market settlement"
        description="Agents bid across five reverse-auction rounds, the Judge Agent selects a winner, and AgentBazaar automatically awards the contract."
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
                {selectedTask.analysis ? (
                  <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-amber-50 text-amber-800 ring-amber-100">
                        {selectedTask.analysis.expectedComplexity}
                      </Badge>
                      <span className="text-xs font-medium text-zinc-500">
                        Complexity {selectedTask.analysis.complexityScore}/100
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-700">
                      {selectedTask.analysis.analysis}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedTask.analysis.skillsRequired.map((skill) => (
                        <Badge
                          key={skill}
                          className="bg-white text-zinc-700 ring-zinc-200"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Reasoning logs
                      </p>
                      {selectedTask.analysis.reasoningLogs.map((log, index) => (
                        <p
                          key={`${log}-${index}`}
                          className="rounded-md bg-white px-3 py-2 text-xs leading-5 text-zinc-600 ring-1 ring-zinc-200"
                        >
                          {log}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <Button
              className="w-full"
              disabled={!selectedTask || isGeneratingBids}
              onClick={() => generateBids(selectedTaskId)}
            >
              <RefreshCw className={isGeneratingBids ? "animate-spin" : ""} />
              {isGeneratingBids ? "Autopilot Running" : "Run Autonomous Auction"}
            </Button>
            {bidError ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {bidError}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bid board</CardTitle>
            <CardDescription>
              Final round bids appear lowest first; confidence and reasoning explain agent behavior.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {taskBids.length === 0 ? (
              <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-center text-sm text-zinc-500">
                Run the autonomous auction to generate bids and auto-award the Judge winner.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Bid</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskBids.map((bid) => {
                    const agent = agents.find((item) => item.id === bid.agentId);
                    const isAwarded = awarded[bid.taskId] === bid.agentId;
                    const isJudgePick = judgeReport?.selectedAgentId === bid.agentId;
                    const taskOutcome = taskOutcomes[bid.taskId];
                    return (
                      <TableRow
                        key={`${bid.taskId}-${bid.agentId}`}
                        className={isJudgePick ? "bg-teal-50/60" : undefined}
                      >
                        <TableCell className="min-w-40 font-medium">
                          <div className="flex flex-wrap items-center gap-2">
                            {agent?.name}
                            {isJudgePick ? (
                              <Badge className="bg-teal-100 text-teal-800 ring-teal-200">
                                Judge Pick
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs font-normal leading-5 text-zinc-500">
                            {bid.reasoning}
                          </p>
                        </TableCell>
                        <TableCell className="min-w-48 text-zinc-600">
                          {agent?.specialty}
                        </TableCell>
                        <TableCell>{formatCurrency(bid.amount)}</TableCell>
                        <TableCell>{bid.estimatedCompletionTime}</TableCell>
                        <TableCell>{Math.round(bid.confidence * 100)}%</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={isAwarded ? "secondary" : "default"}
                            disabled={Boolean(taskOutcome)}
                            onClick={() => awardBid(bid.taskId, bid.agentId)}
                          >
                            {isAwarded ? <CheckCircle2 /> : <Gavel />}
                            {isAwarded
                              ? taskOutcome === "failed"
                                ? "Failed"
                                : "Awarded"
                              : taskOutcome
                                ? "Closed"
                                : "Award"}
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

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Judge Agent evaluation</CardTitle>
              <CardDescription>
                Weighted decision using 0.4 quality, 0.3 reputation, 0.2 price, and 0.1 completion time.
              </CardDescription>
            </div>
            <div className="flex size-11 items-center justify-center rounded-md bg-teal-100 text-teal-800">
              <Scale className="size-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!judgeReport ? (
            <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-center text-sm text-zinc-500">
              Run the reverse auction to generate a full evaluation report.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                <p className="text-sm font-semibold text-teal-900">
                  {judgeReport.selectedAgentName}
                </p>
                <p className="mt-2 text-sm leading-6 text-teal-900">
                  {judgeReport.explanation}
                </p>
                <p className="mt-2 text-xs text-teal-800">
                  Cheapest bid: {judgeReport.cheapestAgentName} at{" "}
                  {formatCurrency(judgeReport.cheapestBid)}
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Reputation</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Report</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {judgeReport.evaluations.map((evaluation) => (
                    <TableRow key={evaluation.agentId}>
                      <TableCell className="font-medium">
                        {evaluation.agentName}
                      </TableCell>
                      <TableCell>{evaluation.totalScore}</TableCell>
                      <TableCell>{evaluation.scores.quality}</TableCell>
                      <TableCell>{evaluation.scores.reputation}</TableCell>
                      <TableCell>{evaluation.scores.price}</TableCell>
                      <TableCell>{evaluation.scores.completionTime}</TableCell>
                      <TableCell className="min-w-72 text-xs leading-5 text-zinc-600">
                        {evaluation.explanation}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Auction history</CardTitle>
          <CardDescription>
            All five rounds are stored in memory for the selected task.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!auctionHistory ? (
            <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-center text-sm text-zinc-500">
              No auction rounds recorded yet.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-5">
              {auctionHistory.rounds.map((round) => {
                const leader = agents.find((agent) => agent.id === round.leaderAgentId);
                return (
                  <div
                    key={`${round.taskId}-${round.round}`}
                    className="rounded-lg border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">Round {round.round}</h2>
                        <p className="mt-1 text-xs text-zinc-500">
                          Leader: {leader?.name ?? round.leaderAgentId}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-teal-700">
                        {formatCurrency(round.lowestBid)}
                      </p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[...round.bids]
                        .sort((a, b) => a.amount - b.amount)
                        .map((bid) => (
                          <div
                            key={`${round.round}-${bid.agentId}`}
                            className="border-t border-zinc-100 pt-3"
                          >
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="font-medium text-zinc-800">
                                {bid.agentName}
                              </span>
                              <span className="font-semibold">
                                {formatCurrency(bid.amount)}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500">
                              <span>Min {formatCurrency(bid.minimumThreshold)}</span>
                              <span>{Math.round(bid.confidence * 100)}% conf</span>
                              <span>{bid.lowered ? "Lowered" : "Held"}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
