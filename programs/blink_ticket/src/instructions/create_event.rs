use anchor_lang::prelude::*;
use crate::state::{Event, ProgramState};
use crate::ErrorCode;

#[derive(Accounts)]
#[instruction(event_name: String)]
pub struct CreateEvent<'info> {
    #[account(
        mut,
        seeds = [b"program-state"],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,
    #[account(
        init,
        payer = organizer,
        space = Event::SPACE,
        seeds = [b"event", organizer.key().as_ref(), program_state.total_events.to_le_bytes().as_ref()],
        bump
    )]
    pub event: Account<'info, Event>,
    #[account(mut)]
    pub organizer: Signer<'info>,
    /// Merkle tree for Compressed NFTs
    /// CHECK: validated by client / Bubblegum integration layer.
    pub merkle_tree: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateEvent>,
    event_name: String,
    symbol: String,
    uri: String,
    total_tickets: u64,
    price_in_sol: u64,
) -> Result<()> {
    let event = &mut ctx.accounts.event;
    let program_state = &mut ctx.accounts.program_state;

    require!(
        event_name.len() > 0 && event_name.len() <= Event::MAX_NAME_LENGTH,
        ErrorCode::InvalidEvent
    );
    require!(
        symbol.len() > 0 && symbol.len() <= Event::MAX_SYMBOL_LENGTH,
        ErrorCode::InvalidEvent
    );
    require!(
        uri.len() > 0 && uri.len() <= Event::MAX_URI_LENGTH,
        ErrorCode::InvalidEvent
    );
    require!(total_tickets > 0, ErrorCode::InvalidEvent);
    require!(price_in_sol > 0, ErrorCode::InvalidPaymentAmount);

    event.bump = ctx.bumps.event;
    event.event_id = program_state.total_events;
    event.organizer = ctx.accounts.organizer.key();
    event.event_name = event_name;
    event.symbol = symbol;
    event.uri = uri;
    event.total_tickets = total_tickets;
    event.tickets_sold = 0;
    event.price_in_lamports = price_in_sol.saturating_mul(1_000_000_000);
    event.created_at = Clock::get()?.unix_timestamp;
    event.event_active = true;
    event.merkle_tree = ctx.accounts.merkle_tree.key();
    event.treasury = ctx.accounts.organizer.key();
    event.revenue_collected = 0;

    program_state.total_events = program_state.total_events.saturating_add(1);

    msg!(
        "Event created: {} (ID: {}) with {} tickets at {} lamports each",
        event.event_name,
        event.event_id,
        total_tickets,
        event.price_in_lamports
    );

    Ok(())
}
