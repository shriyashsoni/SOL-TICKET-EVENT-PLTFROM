use anchor_lang::prelude::*;

declare_id!("E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc");

pub mod instructions;
pub mod state;

use instructions::claim_revenue::ClaimRevenue;
use instructions::create_event::CreateEvent;
use instructions::initialize_program::InitializeProgram;
use instructions::mint_cnft_ticket::MintCNFTTicket;
use instructions::purchase_ticket::PurchaseTicket;
use instructions::transfer_ticket::TransferTicket;
use instructions::update_event::UpdateEvent;
use instructions::verify_ticket::VerifyTicket;

pub(crate) use instructions::claim_revenue::__client_accounts_claim_revenue;
pub(crate) use instructions::create_event::__client_accounts_create_event;
pub(crate) use instructions::initialize_program::__client_accounts_initialize_program;
pub(crate) use instructions::mint_cnft_ticket::__client_accounts_mint_cnft_ticket;
pub(crate) use instructions::purchase_ticket::__client_accounts_purchase_ticket;
pub(crate) use instructions::transfer_ticket::__client_accounts_transfer_ticket;
pub(crate) use instructions::update_event::__client_accounts_update_event;
pub(crate) use instructions::verify_ticket::__client_accounts_verify_ticket;

#[program]
pub mod blink_ticket {
    use super::*;

    /// Initialize the BlinkTicket program state
    pub fn initialize_program(ctx: Context<InitializeProgram>) -> Result<()> {
        instructions::initialize_program::handler(ctx)
    }

    /// Create a new event
    pub fn create_event(
        ctx: Context<CreateEvent>,
        event_name: String,
        symbol: String,
        uri: String,
        total_tickets: u64,
        price_in_sol: u64,
    ) -> Result<()> {
        instructions::create_event::handler(
            ctx,
            event_name,
            symbol,
            uri,
            total_tickets,
            price_in_sol,
        )
    }

    /// Mint compressed NFT ticket
    pub fn mint_cnft_ticket(
        ctx: Context<MintCNFTTicket>,
        leaf_index: u32,
    ) -> Result<()> {
        instructions::mint_cnft_ticket::handler(ctx, leaf_index)
    }

    /// Transfer ticket to another wallet
    pub fn transfer_ticket(
        ctx: Context<TransferTicket>,
        leaf_index: u32,
    ) -> Result<()> {
        instructions::transfer_ticket::handler(ctx, leaf_index)
    }

    /// Process ticket purchase
    pub fn purchase_ticket(
        ctx: Context<PurchaseTicket>,
        amount: u64,
    ) -> Result<()> {
        instructions::purchase_ticket::handler(ctx, amount)
    }

    /// Update event details
    pub fn update_event(
        ctx: Context<UpdateEvent>,
        new_price: u64,
    ) -> Result<()> {
        instructions::update_event::handler(ctx, new_price)
    }

    /// Claim ticket revenue
    pub fn claim_revenue(
        ctx: Context<ClaimRevenue>,
    ) -> Result<()> {
        instructions::claim_revenue::handler(ctx)
    }

    /// Verify ticket ownership
    pub fn verify_ticket(
        ctx: Context<VerifyTicket>,
    ) -> Result<()> {
        instructions::verify_ticket::handler(ctx)
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid event")]
    InvalidEvent,
    #[msg("Event not found")]
    EventNotFound,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid ticket")]
    InvalidTicket,
    #[msg("Ticket already transferred")]
    TicketAlreadyTransferred,
    #[msg("Event capacity exceeded")]
    EventCapacityExceeded,
    #[msg("Invalid payment amount")]
    InvalidPaymentAmount,
    #[msg("Token transfer failed")]
    TokenTransferFailed,
    #[msg("Unsupported operation")]
    UnsupportedOperation,
}
