# AgentBazaar Soroban Contracts

This workspace contains the Soroban smart contract used by AgentBazaar to lock task payouts and release them to the Judge Agent winner.

## Contract

```text
contracts/agentbazaar-escrow
```

The escrow contract stores one record per task:

- buyer
- token contract
- amount
- deadline ledger
- winner
- status

## Public API

- `fund_task(task_id, buyer, token, amount, deadline_ledger)`
- `award_and_release(task_id, winner)`
- `create_task(task_id, buyer, token, amount, deadline_ledger)`
- `deposit(task_id)`
- `set_winner(task_id, winner)`
- `release(task_id)`
- `fail_task(task_id)`
- `refund(task_id)`
- `get_task(task_id)`

## Test And Build

```bash
cargo test
stellar contract build --package agentbazaar-escrow
```

## Testnet Deployment

Current Testnet contract:

```text
CBVWVD2TNPAMPEYZGRXS5VBYCT6X4ZHZFWIWEQDYOPCRIC62N6REQGKC
```

Deploy again:

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/agentbazaar_escrow.wasm \
  --source-account agentbazaar-deployer \
  --network testnet \
  --alias agentbazaar-escrow
```
