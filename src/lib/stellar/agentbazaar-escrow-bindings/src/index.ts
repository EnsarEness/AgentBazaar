import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}





export interface Escrow {
  amount: i128;
  buyer: string;
  deadline_ledger: u32;
  status: EscrowStatus;
  task_id: string;
  token: string;
  winner: Option<string>;
}

export type DataKey = {tag: "Task", values: readonly [string]};



export const EscrowError = {
  1: {message:"AmountMustBePositive"},
  2: {message:"TaskAlreadyExists"},
  3: {message:"TaskNotFound"},
  4: {message:"AlreadyFunded"},
  5: {message:"NotFunded"},
  6: {message:"WinnerAlreadySelected"},
  7: {message:"WinnerMissing"},
  8: {message:"AlreadyClosed"},
  9: {message:"DeadlineNotReached"}
}


export type EscrowStatus = {tag: "Open", values: void} | {tag: "Funded", values: void} | {tag: "WinnerSelected", values: void} | {tag: "Released", values: void} | {tag: "Refunded", values: void} | {tag: "Failed", values: void};




export interface Client {
  /**
   * Construct and simulate a refund transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  refund: ({task_id}: {task_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Escrow>>>

  /**
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  deposit: ({task_id}: {task_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Escrow>>>

  /**
   * Construct and simulate a release transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  release: ({task_id}: {task_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Escrow>>>

  /**
   * Construct and simulate a get_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_task: ({task_id}: {task_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Escrow>>>

  /**
   * Construct and simulate a fail_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  fail_task: ({task_id}: {task_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Escrow>>>

  /**
   * Construct and simulate a fund_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  fund_task: ({task_id, buyer, token, amount, deadline_ledger}: {task_id: string, buyer: string, token: string, amount: i128, deadline_ledger: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Escrow>>>

  /**
   * Construct and simulate a set_winner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_winner: ({task_id, winner}: {task_id: string, winner: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Escrow>>>

  /**
   * Construct and simulate a create_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_task: ({task_id, buyer, token, amount, deadline_ledger}: {task_id: string, buyer: string, token: string, amount: i128, deadline_ledger: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Escrow>>>

  /**
   * Construct and simulate a award_and_release transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  award_and_release: ({task_id, winner}: {task_id: string, winner: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Escrow>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABkVzY3JvdwAAAAAABwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAVidXllcgAAAAAAABMAAAAAAAAAD2RlYWRsaW5lX2xlZGdlcgAAAAAEAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAAMRXNjcm93U3RhdHVzAAAAAAAAAAd0YXNrX2lkAAAAABAAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAGd2lubmVyAAAAAAPoAAAAEw==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAQAAAAEAAAAAAAAABFRhc2sAAAABAAAAEA==",
        "AAAABQAAAAAAAAAAAAAAClRhc2tGYWlsZWQAAAAAAAIAAAADYWJ6AAAAAAZmYWlsZWQAAAAAAAIAAAAAAAAAB3Rhc2tfaWQAAAAAEAAAAAEAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAAClRhc2tGdW5kZWQAAAAAAAIAAAADYWJ6AAAAAAZmdW5kZWQAAAAAAAIAAAAAAAAAB3Rhc2tfaWQAAAAAEAAAAAEAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAC",
        "AAAABAAAAAAAAAAAAAAAC0VzY3Jvd0Vycm9yAAAAAAkAAAAAAAAAFEFtb3VudE11c3RCZVBvc2l0aXZlAAAAAQAAAAAAAAARVGFza0FscmVhZHlFeGlzdHMAAAAAAAACAAAAAAAAAAxUYXNrTm90Rm91bmQAAAADAAAAAAAAAA1BbHJlYWR5RnVuZGVkAAAAAAAABAAAAAAAAAAJTm90RnVuZGVkAAAAAAAABQAAAAAAAAAVV2lubmVyQWxyZWFkeVNlbGVjdGVkAAAAAAAABgAAAAAAAAANV2lubmVyTWlzc2luZwAAAAAAAAcAAAAAAAAADUFscmVhZHlDbG9zZWQAAAAAAAAIAAAAAAAAABJEZWFkbGluZU5vdFJlYWNoZWQAAAAAAAk=",
        "AAAABQAAAAAAAAAAAAAAC1Rhc2tDcmVhdGVkAAAAAAIAAAADYWJ6AAAAAAdjcmVhdGVkAAAAAAIAAAAAAAAAB3Rhc2tfaWQAAAAAEAAAAAEAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAC",
        "AAAAAgAAAAAAAAAAAAAADEVzY3Jvd1N0YXR1cwAAAAYAAAAAAAAAAAAAAARPcGVuAAAAAAAAAAAAAAAGRnVuZGVkAAAAAAAAAAAAAAAAAA5XaW5uZXJTZWxlY3RlZAAAAAAAAAAAAAAAAAAIUmVsZWFzZWQAAAAAAAAAAAAAAAhSZWZ1bmRlZAAAAAAAAAAAAAAABkZhaWxlZAAA",
        "AAAABQAAAAAAAAAAAAAADldpbm5lclNlbGVjdGVkAAAAAAACAAAAA2FiegAAAAAGd2lubmVyAAAAAAACAAAAAAAAAAd0YXNrX2lkAAAAABAAAAABAAAAAAAAAAZ3aW5uZXIAAAAAABMAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAD1BheW1lbnRSZWZ1bmRlZAAAAAACAAAAA2FiegAAAAAIcmVmdW5kZWQAAAACAAAAAAAAAAd0YXNrX2lkAAAAABAAAAABAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAD1BheW1lbnRSZWxlYXNlZAAAAAACAAAAA2FiegAAAAAIcmVsZWFzZWQAAAADAAAAAAAAAAd0YXNrX2lkAAAAABAAAAABAAAAAAAAAAZ3aW5uZXIAAAAAABMAAAAAAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAg==",
        "AAAAAAAAAAAAAAAGcmVmdW5kAAAAAAABAAAAAAAAAAd0YXNrX2lkAAAAABAAAAABAAAD6QAAB9AAAAAGRXNjcm93AAAAAAfQAAAAC0VzY3Jvd0Vycm9yAA==",
        "AAAAAAAAAAAAAAAHZGVwb3NpdAAAAAABAAAAAAAAAAd0YXNrX2lkAAAAABAAAAABAAAD6QAAB9AAAAAGRXNjcm93AAAAAAfQAAAAC0VzY3Jvd0Vycm9yAA==",
        "AAAAAAAAAAAAAAAHcmVsZWFzZQAAAAABAAAAAAAAAAd0YXNrX2lkAAAAABAAAAABAAAD6QAAB9AAAAAGRXNjcm93AAAAAAfQAAAAC0VzY3Jvd0Vycm9yAA==",
        "AAAAAAAAAAAAAAAIZ2V0X3Rhc2sAAAABAAAAAAAAAAd0YXNrX2lkAAAAABAAAAABAAAD6QAAB9AAAAAGRXNjcm93AAAAAAfQAAAAC0VzY3Jvd0Vycm9yAA==",
        "AAAAAAAAAAAAAAAJZmFpbF90YXNrAAAAAAAAAQAAAAAAAAAHdGFza19pZAAAAAAQAAAAAQAAA+kAAAfQAAAABkVzY3JvdwAAAAAH0AAAAAtFc2Nyb3dFcnJvcgA=",
        "AAAAAAAAAAAAAAAJZnVuZF90YXNrAAAAAAAABQAAAAAAAAAHdGFza19pZAAAAAAQAAAAAAAAAAVidXllcgAAAAAAABMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAA9kZWFkbGluZV9sZWRnZXIAAAAABAAAAAEAAAPpAAAH0AAAAAZFc2Nyb3cAAAAAB9AAAAALRXNjcm93RXJyb3IA",
        "AAAAAAAAAAAAAAAKc2V0X3dpbm5lcgAAAAAAAgAAAAAAAAAHdGFza19pZAAAAAAQAAAAAAAAAAZ3aW5uZXIAAAAAABMAAAABAAAD6QAAB9AAAAAGRXNjcm93AAAAAAfQAAAAC0VzY3Jvd0Vycm9yAA==",
        "AAAAAAAAAAAAAAALY3JlYXRlX3Rhc2sAAAAABQAAAAAAAAAHdGFza19pZAAAAAAQAAAAAAAAAAVidXllcgAAAAAAABMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAA9kZWFkbGluZV9sZWRnZXIAAAAABAAAAAEAAAPpAAAH0AAAAAZFc2Nyb3cAAAAAB9AAAAALRXNjcm93RXJyb3IA",
        "AAAAAAAAAAAAAAARYXdhcmRfYW5kX3JlbGVhc2UAAAAAAAACAAAAAAAAAAd0YXNrX2lkAAAAABAAAAAAAAAABndpbm5lcgAAAAAAEwAAAAEAAAPpAAAH0AAAAAZFc2Nyb3cAAAAAB9AAAAALRXNjcm93RXJyb3IA" ]),
      options
    )
  }
  public readonly fromJSON = {
    refund: this.txFromJSON<Result<Escrow>>,
        deposit: this.txFromJSON<Result<Escrow>>,
        release: this.txFromJSON<Result<Escrow>>,
        get_task: this.txFromJSON<Result<Escrow>>,
        fail_task: this.txFromJSON<Result<Escrow>>,
        fund_task: this.txFromJSON<Result<Escrow>>,
        set_winner: this.txFromJSON<Result<Escrow>>,
        create_task: this.txFromJSON<Result<Escrow>>,
        award_and_release: this.txFromJSON<Result<Escrow>>
  }
}