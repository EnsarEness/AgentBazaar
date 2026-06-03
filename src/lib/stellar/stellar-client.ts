"use client";

import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import freighterApi from "@stellar/freighter-api";

const horizonUrl = "https://horizon-testnet.stellar.org";
const friendbotUrl = "https://friendbot.stellar.org";

const server = new Horizon.Server(horizonUrl);

type FreighterError = {
  message?: string;
};

export type StellarWalletState = {
  address: string;
  network: string;
  networkPassphrase: string;
};

export type StellarSettlementInput = {
  sourceAddress: string;
  destinationAddress: string;
  amountXlm: string;
};

function getFreighterErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as FreighterError).message);
  }

  return "Freighter returned an error.";
}

async function accountExists(address: string) {
  try {
    await server.loadAccount(address);
    return true;
  } catch {
    return false;
  }
}

export function convertMarketBidToXlm(bidAmount: number) {
  const xlmAmount = Math.min(25, Math.max(1, bidAmount / 1000));
  return xlmAmount.toFixed(2);
}

export function getStellarExplorerUrl(transactionHash: string) {
  return `https://stellar.expert/explorer/testnet/tx/${transactionHash}`;
}

export async function connectFreighterWallet(): Promise<StellarWalletState> {
  const connection = await freighterApi.isConnected();

  if (!connection.isConnected) {
    throw new Error("Freighter wallet is not installed or not connected.");
  }

  const access = await freighterApi.requestAccess();
  if (access.error || !access.address) {
    throw new Error(
      access.error ? getFreighterErrorMessage(access.error) : "Wallet access denied.",
    );
  }

  const network = await freighterApi.getNetwork();
  if (network.error) {
    throw new Error(getFreighterErrorMessage(network.error));
  }

  if (network.networkPassphrase !== Networks.TESTNET) {
    throw new Error("Switch Freighter to Stellar Testnet before paying.");
  }

  return {
    address: access.address,
    network: network.network || "TESTNET",
    networkPassphrase: network.networkPassphrase,
  };
}

export async function fundTestnetWallet(address: string) {
  const response = await fetch(`${friendbotUrl}?addr=${address}`);

  if (!response.ok) {
    throw new Error("Friendbot could not fund this Testnet account.");
  }

  return response.json();
}

export async function submitWinnerPayment({
  sourceAddress,
  destinationAddress,
  amountXlm,
}: StellarSettlementInput) {
  const sourceAccount = await server.loadAccount(sourceAddress);
  const destinationExists = await accountExists(destinationAddress);
  const operation = destinationExists
    ? Operation.payment({
        destination: destinationAddress,
        asset: Asset.native(),
        amount: amountXlm,
      })
    : Operation.createAccount({
        destination: destinationAddress,
        startingBalance: amountXlm,
      });

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(operation)
    .addMemo(Memo.text("AgentBazaar"))
    .setTimeout(30)
    .build();

  const signed = await freighterApi.signTransaction(transaction.toXDR(), {
    address: sourceAddress,
    networkPassphrase: Networks.TESTNET,
  });

  if (signed.error || !signed.signedTxXdr) {
    throw new Error(
      signed.error
        ? getFreighterErrorMessage(signed.error)
        : "Freighter did not return a signed transaction.",
    );
  }

  const signedTransaction = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    Networks.TESTNET,
  );
  const result = await server.submitTransaction(signedTransaction);

  return {
    transactionHash: result.hash,
    explorerUrl: getStellarExplorerUrl(result.hash),
  };
}
