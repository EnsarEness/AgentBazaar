"use client";

import { Banknote, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeading } from "@/components/page-heading";
import { formatCurrency } from "@/lib/utils";
import { useEconomyStore } from "@/store/economy-store";

export default function AgentsPage() {
  const agents = useEconomyStore((state) => state.agents);

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
    </>
  );
}
