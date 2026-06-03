"use client";

import { useState } from "react";
import { ExternalLink, Landmark, Loader2, LockKeyhole, Send, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  connectFreighterWallet,
  convertMarketBidToXlm,
  fundTestnetWallet,
  type StellarWalletState,
} from "@/lib/stellar/stellar-client";
import {
  fundSorobanTaskEscrow,
  getSorobanEscrowConfig,
  releaseSorobanTaskEscrow,
} from "@/lib/stellar/soroban-escrow-client";
import type { Agent, Bid, StellarEscrow, StellarPayment, Task } from "@/types/economy";

export function StellarEscrowPanel({
  task,
  agent,
  bid,
  escrow,
  payment,
  onEscrowChange,
  onPaid,
}: {
  task: Task;
  agent: Agent;
  bid: Bid;
  escrow?: StellarEscrow;
  payment?: StellarPayment;
  onEscrowChange: (escrow: StellarEscrow) => void;
  onPaid: (payment: StellarPayment) => void;
}) {
  const [wallet, setWallet] = useState<StellarWalletState | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const amountXlm = convertMarketBidToXlm(bid.amount);
  const contractConfig = getSorobanEscrowConfig();
  const releasedExplorerUrl = escrow?.releaseExplorerUrl ?? payment?.explorerUrl;
  const releasedAmount = escrow?.amountXlm ?? payment?.amountXlm ?? amountXlm;

  async function connectWallet() {
    setIsBusy(true);
    setError(null);
    try {
      const nextWallet = await connectFreighterWallet();
      setWallet(nextWallet);
      setStatus("Freighter connected on Stellar Testnet.");
      return nextWallet;
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Could not connect wallet.",
      );
      return null;
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

  async function depositToContract() {
    const activeWallet = wallet ?? (await connectWallet());
    if (!activeWallet) {
      return;
    }

    setIsBusy(true);
    setError(null);
    try {
      const result = await fundSorobanTaskEscrow({
        wallet: activeWallet,
        task,
        bid,
      });

      onEscrowChange({
        taskId: task.id,
        agentId: agent.id,
        funderAddress: activeWallet.address,
        contractId: result.contractId,
        tokenContractId: result.nativeTokenContractId,
        destinationAddress: agent.walletAddress,
        amountXlm: result.amountXlm,
        amountStroops: result.amountStroops,
        deadlineLedger: result.deadlineLedger,
        status: "funded",
        depositTransactionHash: result.transactionHash,
        depositExplorerUrl: result.explorerUrl,
        fundedAt: new Date().toISOString(),
      });
      setStatus("Soroban contract escrow funded.");
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Soroban deposit failed.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function releaseContractEscrow() {
    if (!escrow) {
      return;
    }

    const activeWallet = wallet ?? (await connectWallet());
    if (!activeWallet) {
      return;
    }

    setIsBusy(true);
    setError(null);
    try {
      const result = await releaseSorobanTaskEscrow({
        wallet: activeWallet,
        task,
        agent,
      });
      const releasedAt = new Date().toISOString();

      onEscrowChange({
        ...escrow,
        status: "released",
        releaseTransactionHash: result.transactionHash,
        releaseExplorerUrl: result.explorerUrl,
        releasedAt,
      });
      onPaid({
        taskId: task.id,
        agentId: agent.id,
        sourceAddress: escrow.contractId,
        destinationAddress: agent.walletAddress,
        amountXlm: escrow.amountXlm,
        transactionHash: result.transactionHash,
        explorerUrl: result.explorerUrl,
        paidAt: releasedAt,
      });
      setStatus("Soroban contract released payment to winner.");
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Soroban release failed.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  if (releasedExplorerUrl) {
    return (
      <div className="space-y-2 text-right">
        <div className="flex flex-col gap-2 sm:items-end">
          <Badge className="w-fit bg-emerald-50 text-emerald-800 ring-emerald-100">
            Contract Released
          </Badge>
          <Button asChild size="sm" variant="secondary">
            <a href={releasedExplorerUrl} target="_blank" rel="noreferrer">
              <ExternalLink />
              View Release Tx
            </a>
          </Button>
        </div>
        <p className="text-xs text-zinc-500">{releasedAmount} XLM paid</p>
      </div>
    );
  }

  if (escrow?.status === "funded") {
    return (
      <div className="space-y-2 text-right">
        <div className="flex flex-col gap-2 sm:items-end">
          <Badge className="w-fit bg-cyan-50 text-cyan-800 ring-cyan-100">
            Contract Funded
          </Badge>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild size="sm" variant="outline">
              <a href={escrow.depositExplorerUrl} target="_blank" rel="noreferrer">
                <ExternalLink />
                Deposit Tx
              </a>
            </Button>
            <Button size="sm" disabled={isBusy} onClick={releaseContractEscrow}>
              {isBusy ? <Loader2 className="animate-spin" /> : <Send />}
              Release
            </Button>
          </div>
        </div>
        <p className="max-w-72 text-xs text-zinc-500 sm:ml-auto">
          {status ?? `Contract ${escrow.contractId.slice(0, 8)}...`}
        </p>
        {error ? (
          <p className="max-w-72 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 sm:ml-auto">
            {error}
          </p>
        ) : null}
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
            <Button
              size="sm"
              disabled={isBusy || !contractConfig.isReady}
              onClick={depositToContract}
            >
              {isBusy ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
              Deposit {amountXlm} XLM
            </Button>
          </div>
        ) : null}
      </div>
      <p className="max-w-72 text-xs text-zinc-500 sm:ml-auto">
        {status ??
          `Soroban contract: ${contractConfig.contractId.slice(0, 8)}...`}
      </p>
      {error ? (
        <p className="max-w-72 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 sm:ml-auto">
          {error}
        </p>
      ) : null}
    </div>
  );
}
