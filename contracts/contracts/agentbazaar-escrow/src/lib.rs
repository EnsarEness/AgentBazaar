#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,
    MuxedAddress, String,
};

#[contract]
pub struct AgentBazaarEscrowContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Open,
    Funded,
    WinnerSelected,
    Released,
    Refunded,
    Failed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub task_id: String,
    pub buyer: Address,
    pub token: Address,
    pub amount: i128,
    pub deadline_ledger: u32,
    pub winner: Option<Address>,
    pub status: EscrowStatus,
}

#[contractevent(topics = ["abz", "created"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TaskCreated {
    #[topic]
    pub task_id: String,
    pub amount: i128,
}

#[contractevent(topics = ["abz", "funded"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TaskFunded {
    #[topic]
    pub task_id: String,
    pub amount: i128,
}

#[contractevent(topics = ["abz", "winner"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WinnerSelected {
    #[topic]
    pub task_id: String,
    pub winner: Address,
}

#[contractevent(topics = ["abz", "released"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentReleased {
    #[topic]
    pub task_id: String,
    pub winner: Address,
    pub amount: i128,
}

#[contractevent(topics = ["abz", "failed"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TaskFailed {
    #[topic]
    pub task_id: String,
    pub amount: i128,
}

#[contractevent(topics = ["abz", "refunded"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentRefunded {
    #[topic]
    pub task_id: String,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Task(String),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum EscrowError {
    AmountMustBePositive = 1,
    TaskAlreadyExists = 2,
    TaskNotFound = 3,
    AlreadyFunded = 4,
    NotFunded = 5,
    WinnerAlreadySelected = 6,
    WinnerMissing = 7,
    AlreadyClosed = 8,
    DeadlineNotReached = 9,
}

fn task_key(task_id: &String) -> DataKey {
    DataKey::Task(task_id.clone())
}

fn load_escrow(env: &Env, task_id: &String) -> Result<Escrow, EscrowError> {
    env.storage()
        .persistent()
        .get(&task_key(task_id))
        .ok_or(EscrowError::TaskNotFound)
}

fn save_escrow(env: &Env, escrow: &Escrow) {
    env.storage()
        .persistent()
        .set(&task_key(&escrow.task_id), escrow);
}

fn ensure_not_closed(status: &EscrowStatus) -> Result<(), EscrowError> {
    match status {
        EscrowStatus::Released | EscrowStatus::Refunded => Err(EscrowError::AlreadyClosed),
        _ => Ok(()),
    }
}

#[contractimpl]
impl AgentBazaarEscrowContract {
    pub fn create_task(
        env: Env,
        task_id: String,
        buyer: Address,
        token: Address,
        amount: i128,
        deadline_ledger: u32,
    ) -> Result<Escrow, EscrowError> {
        buyer.require_auth();

        if amount <= 0 {
            return Err(EscrowError::AmountMustBePositive);
        }

        let key = task_key(&task_id);
        if env.storage().persistent().has(&key) {
            return Err(EscrowError::TaskAlreadyExists);
        }

        let escrow = Escrow {
            task_id: task_id.clone(),
            buyer,
            token,
            amount,
            deadline_ledger,
            winner: None,
            status: EscrowStatus::Open,
        };

        save_escrow(&env, &escrow);
        TaskCreated {
            task_id,
            amount: escrow.amount,
        }
        .publish(&env);

        Ok(escrow)
    }

    pub fn deposit(env: Env, task_id: String) -> Result<Escrow, EscrowError> {
        let mut escrow = load_escrow(&env, &task_id)?;
        escrow.buyer.require_auth();

        match escrow.status {
            EscrowStatus::Open => {}
            EscrowStatus::Funded | EscrowStatus::WinnerSelected => {
                return Err(EscrowError::AlreadyFunded);
            }
            EscrowStatus::Released | EscrowStatus::Refunded | EscrowStatus::Failed => {
                return Err(EscrowError::AlreadyClosed);
            }
        }

        let token_client = token::TokenClient::new(&env, &escrow.token);
        let contract_address: MuxedAddress = env.current_contract_address().into();
        token_client.transfer(&escrow.buyer, &contract_address, &escrow.amount);

        escrow.status = EscrowStatus::Funded;
        save_escrow(&env, &escrow);
        TaskFunded {
            task_id,
            amount: escrow.amount,
        }
        .publish(&env);

        Ok(escrow)
    }

    pub fn fund_task(
        env: Env,
        task_id: String,
        buyer: Address,
        token: Address,
        amount: i128,
        deadline_ledger: u32,
    ) -> Result<Escrow, EscrowError> {
        Self::create_task(
            env.clone(),
            task_id.clone(),
            buyer,
            token,
            amount,
            deadline_ledger,
        )?;
        Self::deposit(env, task_id)
    }

    pub fn set_winner(env: Env, task_id: String, winner: Address) -> Result<Escrow, EscrowError> {
        let mut escrow = load_escrow(&env, &task_id)?;
        escrow.buyer.require_auth();
        ensure_not_closed(&escrow.status)?;

        match escrow.status {
            EscrowStatus::Open => return Err(EscrowError::NotFunded),
            EscrowStatus::WinnerSelected => return Err(EscrowError::WinnerAlreadySelected),
            EscrowStatus::Failed => return Err(EscrowError::AlreadyClosed),
            EscrowStatus::Funded => {}
            EscrowStatus::Released | EscrowStatus::Refunded => {}
        }

        escrow.winner = Some(winner.clone());
        escrow.status = EscrowStatus::WinnerSelected;
        save_escrow(&env, &escrow);
        WinnerSelected { task_id, winner }.publish(&env);

        Ok(escrow)
    }

    pub fn release(env: Env, task_id: String) -> Result<Escrow, EscrowError> {
        let mut escrow = load_escrow(&env, &task_id)?;
        escrow.buyer.require_auth();
        ensure_not_closed(&escrow.status)?;

        if escrow.status != EscrowStatus::WinnerSelected {
            return Err(EscrowError::WinnerMissing);
        }

        let winner = escrow.winner.clone().ok_or(EscrowError::WinnerMissing)?;
        let token_client = token::TokenClient::new(&env, &escrow.token);
        let winner_address: MuxedAddress = winner.clone().into();
        token_client.transfer(
            &env.current_contract_address(),
            &winner_address,
            &escrow.amount,
        );

        escrow.status = EscrowStatus::Released;
        save_escrow(&env, &escrow);
        PaymentReleased {
            task_id,
            winner,
            amount: escrow.amount,
        }
        .publish(&env);

        Ok(escrow)
    }

    pub fn award_and_release(
        env: Env,
        task_id: String,
        winner: Address,
    ) -> Result<Escrow, EscrowError> {
        Self::set_winner(env.clone(), task_id.clone(), winner)?;
        Self::release(env, task_id)
    }

    pub fn fail_task(env: Env, task_id: String) -> Result<Escrow, EscrowError> {
        let mut escrow = load_escrow(&env, &task_id)?;
        escrow.buyer.require_auth();
        ensure_not_closed(&escrow.status)?;

        escrow.status = EscrowStatus::Failed;
        save_escrow(&env, &escrow);
        TaskFailed {
            task_id,
            amount: escrow.amount,
        }
        .publish(&env);

        Ok(escrow)
    }

    pub fn refund(env: Env, task_id: String) -> Result<Escrow, EscrowError> {
        let mut escrow = load_escrow(&env, &task_id)?;
        escrow.buyer.require_auth();
        ensure_not_closed(&escrow.status)?;

        match escrow.status {
            EscrowStatus::Open => return Err(EscrowError::NotFunded),
            EscrowStatus::Failed => {}
            _ => {
                if env.ledger().sequence() < escrow.deadline_ledger {
                    return Err(EscrowError::DeadlineNotReached);
                }
            }
        }

        let token_client = token::TokenClient::new(&env, &escrow.token);
        let buyer_address: MuxedAddress = escrow.buyer.clone().into();
        token_client.transfer(
            &env.current_contract_address(),
            &buyer_address,
            &escrow.amount,
        );

        escrow.status = EscrowStatus::Refunded;
        save_escrow(&env, &escrow);
        PaymentRefunded {
            task_id,
            amount: escrow.amount,
        }
        .publish(&env);

        Ok(escrow)
    }

    pub fn get_task(env: Env, task_id: String) -> Result<Escrow, EscrowError> {
        load_escrow(&env, &task_id)
    }
}

mod test;
