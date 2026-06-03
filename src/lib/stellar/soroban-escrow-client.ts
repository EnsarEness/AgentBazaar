"use client";

import { Networks } from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";
import freighterApi from "@stellar/freighter-api";
import {
  Client as AgentBazaarEscrowClient,
  type Escrow,
} from "@/lib/stellar/agentbazaar-escrow-bindings/src";
import {
  convertMarketBidToXlm,
  getStellarExplorerUrl,
  type StellarWalletState,
} from "@/lib/stellar/stellar-client";
import type { Agent, Bid, Task } from "@/types/economy";

const sorobanRpcUrl = "https://soroban-testnet.stellar.org";
const defaultEscrowContractId = "CBVWVD2TNPAMPEYZGRXS5VBYCT6X4ZHZFWIWEQDYOPCRIC62N6REQGKC";
const defaultNativeTokenContractId =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

const stroopsPerXlm = BigInt(10_000_000);
const defaultDeadlineLedgerOffset = 17_280;

type ContractResult<T> = {
  unwrap: () => T;
  unwrapErr: () => { message: string };
  isErr: () => boolean;
};

type SentContractTransaction<T> = {
  result: ContractResult<T>;
  sendTransactionResponse?: {
    hash: string;
  };
  getTransactionResponse?: {
    txHash: string;
  };
};

export type SorobanEscrowTransaction = {
  transactionHash: string;
  explorerUrl: string;
  escrow: Escrow;
};

export function getSorobanEscrowConfig() {
  const contractId =
    process.env.NEXT_PUBLIC_AGENTBAZAAR_ESCROW_CONTRACT_ID ??
    defaultEscrowContractId;
  const nativeTokenContractId =
    process.env.NEXT_PUBLIC_STELLAR_NATIVE_TOKEN_CONTRACT_ID ??
    defaultNativeTokenContractId;

  return {
    contractId,
    nativeTokenContractId,
    networkPassphrase: Networks.TESTNET,
    rpcUrl: sorobanRpcUrl,
    isReady: Boolean(contractId && nativeTokenContractId),
  };
}

export function xlmToStroops(amountXlm: string) {
  const [wholePart, fractionalPart = ""] = amountXlm.split(".");
  const normalizedFraction = `${fractionalPart}0000000`.slice(0, 7);

  return BigInt(wholePart) * stroopsPerXlm + BigInt(normalizedFraction);
}

export function stroopsToXlm(stroops: bigint) {
  const whole = stroops / stroopsPerXlm;
  const fraction = (stroops % stroopsPerXlm).toString().padStart(7, "0");

  return `${whole}.${fraction.slice(0, 2)}`;
}

function getTransactionHash<T>(sent: SentContractTransaction<T>) {
  return sent.sendTransactionResponse?.hash ?? sent.getTransactionResponse?.txHash;
}

function unwrapContractResult<T>(result: ContractResult<T>) {
  if (result.isErr()) {
    throw new Error(result.unwrapErr().message);
  }

  return result.unwrap();
}

function getContractClient(wallet: StellarWalletState) {
  const config = getSorobanEscrowConfig();

  return new AgentBazaarEscrowClient({
    contractId: config.contractId,
    networkPassphrase: config.networkPassphrase,
    publicKey: wallet.address,
    rpcUrl: config.rpcUrl,
    signTransaction: async (transactionXdr, options) => {
      const signed = await freighterApi.signTransaction(transactionXdr, {
        ...options,
        address: wallet.address,
        networkPassphrase: config.networkPassphrase,
      });

      if (signed.error || !signed.signedTxXdr) {
        throw new Error(
          signed.error?.message ?? "Freighter did not sign the Soroban transaction.",
        );
      }

      return {
        signedTxXdr: signed.signedTxXdr,
        signerAddress: signed.signerAddress,
      };
    },
  });
}

export async function fundSorobanTaskEscrow({
  wallet,
  task,
  bid,
}: {
  wallet: StellarWalletState;
  task: Task;
  bid: Bid;
}) {
  const config = getSorobanEscrowConfig();
  const client = getContractClient(wallet);
  const latestLedger = await new Server(config.rpcUrl).getLatestLedger();
  const amountXlm = convertMarketBidToXlm(bid.amount);
  const amountStroops = xlmToStroops(amountXlm);
  const deadlineLedger = latestLedger.sequence + defaultDeadlineLedgerOffset;
  const transaction = await client.fund_task(
    {
      task_id: task.id,
      buyer: wallet.address,
      token: config.nativeTokenContractId,
      amount: amountStroops,
      deadline_ledger: deadlineLedger,
    },
    { timeoutInSeconds: 60 },
  );
  const sent = (await transaction.signAndSend({
    force: true,
  })) as SentContractTransaction<Escrow>;
  const transactionHash = getTransactionHash(sent);

  if (!transactionHash) {
    throw new Error("Soroban did not return a transaction hash.");
  }

  return {
    amountXlm,
    amountStroops: amountStroops.toString(),
    contractId: config.contractId,
    deadlineLedger,
    explorerUrl: getStellarExplorerUrl(transactionHash),
    nativeTokenContractId: config.nativeTokenContractId,
    transactionHash,
    escrow: unwrapContractResult(sent.result),
  };
}

export async function releaseSorobanTaskEscrow({
  wallet,
  task,
  agent,
}: {
  wallet: StellarWalletState;
  task: Task;
  agent: Agent;
}) {
  const client = getContractClient(wallet);
  const transaction = await client.award_and_release(
    {
      task_id: task.id,
      winner: agent.walletAddress,
    },
    { timeoutInSeconds: 60 },
  );
  const sent = (await transaction.signAndSend({
    force: true,
  })) as SentContractTransaction<Escrow>;
  const transactionHash = getTransactionHash(sent);

  if (!transactionHash) {
    throw new Error("Soroban did not return a release transaction hash.");
  }

  return {
    transactionHash,
    explorerUrl: getStellarExplorerUrl(transactionHash),
    escrow: unwrapContractResult(sent.result),
  };
}
