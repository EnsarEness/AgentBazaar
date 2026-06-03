"use client";

import { useState } from "react";
import { ExternalLink, Landmark, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  connectFreighterWallet,
  convertMarketBidToXlm,
  fundTestnetWallet,
  submitWinnerPayment,
  type StellarWalletState,
} from "@/lib/stellar/stellar-client";
import type { Agent, Bid, StellarPayment, Task } from "@/types/economy";

export function StellarSettlementButton({
  task,
  agent,
  bid,
  payment,
  onPaid,
}: {
  task: Task;
  agent: Agent;
  bid: Bid;
  payment?: StellarPayment;
  onPaid: (payment: StellarPayment) => void;
}) {
  const [wallet, setWallet] = useState<StellarWalletState | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const amountXlm = convertMarketBidToXlm(bid.amount);

  async function connectWallet() {
    setIsBusy(true);
    setError(null);
    try {
      const nextWallet = await connectFreighterWallet();
      setWallet(nextWallet);
      setStatus("Freighter connected on Testnet.");
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Could not connect wallet.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function fundWallet() {
    if (!wallet) {
      return;
    }

    setIsBusy(true);
    setError(null);
    try {
      await fundTestnetWallet(wallet.address);
      setStatus("Testnet wallet funded with Friendbot.");
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Could not fund wallet.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function payWinner() {
    if (!wallet) {
      await connectWallet();
      return;
    }

    setIsBusy(true);
    setError(null);
    try {
      const result = await submitWinnerPayment({
        sourceAddress: wallet.address,
        destinationAddress: agent.walletAddress,
        amountXlm,
      });

      onPaid({
        taskId: task.id,
        agentId: agent.id,
        sourceAddress: wallet.address,
        destinationAddress: agent.walletAddress,
        amountXlm,
        transactionHash: result.transactionHash,
        explorerUrl: result.explorerUrl,
        paidAt: new Date().toISOString(),
      });
      setStatus("Winner paid on Stellar Testnet.");
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Stellar payment failed.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  if (payment) {
    return (
      <div className="space-y-2 text-right">
        <Button asChild size="sm" variant="secondary">
          <a href={payment.explorerUrl} target="_blank" rel="noreferrer">
            <ExternalLink />
            View Tx
          </a>
        </Button>
        <p className="text-xs text-zinc-500">{payment.amountXlm} XLM paid</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-right">
      <div className="flex flex-col gap-2 sm:items-end">
        <Button
          size="sm"
          variant={wallet ? "outline" : "secondary"}
          disabled={isBusy}
          onClick={connectWallet}
        >
          {isBusy && !wallet ? <Loader2 className="animate-spin" /> : <Wallet />}
          {wallet ? "Wallet Connected" : "Connect Freighter"}
        </Button>
        {wallet ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="sm" variant="outline" disabled={isBusy} onClick={fundWallet}>
              <Landmark />
              Fund Testnet
            </Button>
            <Button size="sm" disabled={isBusy} onClick={payWinner}>
              {isBusy ? <Loader2 className="animate-spin" /> : <Wallet />}
              Pay {amountXlm} XLM
            </Button>
          </div>
        ) : null}
      </div>
      <p className="max-w-64 text-xs text-zinc-500 sm:ml-auto">
        {status ?? `Winner wallet: ${agent.walletAddress.slice(0, 8)}...`}
      </p>
      {error ? (
        <p className="max-w-64 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 sm:ml-auto">
          {error}
        </p>
      ) : null}
    </div>
  );
}
