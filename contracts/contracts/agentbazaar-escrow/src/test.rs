#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env, String,
};

fn setup() -> (
    Env,
    Address,
    AgentBazaarEscrowContractClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();

    let buyer = Address::generate(&env);
    let winner = Address::generate(&env);
    let admin = Address::generate(&env);
    let asset = env.register_stellar_asset_contract_v2(admin);
    let token = asset.address();

    StellarAssetClient::new(&env, &token).mint(&buyer, &10_000);

    let contract_id = env.register(AgentBazaarEscrowContract, ());
    let client = AgentBazaarEscrowContractClient::new(&env, &contract_id);

    (env, contract_id, client, buyer, winner, token)
}

#[test]
fn deposit_and_release_to_winner() {
    let (env, contract_id, client, buyer, winner, token) = setup();
    let token_client = TokenClient::new(&env, &token);
    let task_id = String::from_str(&env, "task-api");
    let amount = 1_500;

    let funded = client.fund_task(
        &task_id,
        &buyer,
        &token,
        &amount,
        &env.ledger().sequence().checked_add(100).unwrap(),
    );
    assert_eq!(funded.status, EscrowStatus::Funded);
    assert_eq!(token_client.balance(&contract_id), amount);
    assert_eq!(token_client.balance(&buyer), 8_500);

    let released = client.award_and_release(&task_id, &winner);
    assert_eq!(released.status, EscrowStatus::Released);
    assert_eq!(released.winner, Some(winner.clone()));
    assert_eq!(token_client.balance(&winner), amount);
    assert_eq!(token_client.balance(&contract_id), 0);
}

#[test]
fn failed_task_can_refund_buyer() {
    let (env, contract_id, client, buyer, _winner, token) = setup();
    let token_client = TokenClient::new(&env, &token);
    let task_id = String::from_str(&env, "task-refund");
    let amount = 900;

    client.create_task(
        &task_id,
        &buyer,
        &token,
        &amount,
        &env.ledger().sequence().checked_add(100).unwrap(),
    );
    client.deposit(&task_id);
    client.fail_task(&task_id);

    let refunded = client.refund(&task_id);
    assert_eq!(refunded.status, EscrowStatus::Refunded);
    assert_eq!(token_client.balance(&buyer), 10_000);
    assert_eq!(token_client.balance(&contract_id), 0);
}
