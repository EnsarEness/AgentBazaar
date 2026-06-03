"use client";

import { Networks } from "@stellar/stellar-sdk";
import freighterApi from "@stellar/freighter-api";

const friendbotUrl = "https://friendbot.stellar.org";

type FreighterError = {
  message?: string;
};

export type StellarWalletState = {
  address: string;
  network: string;
  networkPassphrase: string;
};

function getFreighterErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as FreighterError).message);
  }

  return "Freighter returned an error.";
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
