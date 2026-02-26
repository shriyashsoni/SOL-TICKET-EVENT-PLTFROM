use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use crate::state::{Event, ProgramState};
use crate::ErrorCode;

const EVENT_POST_FEE_LAMPORTS: u64 = 100_000;

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
    #[account(mut, address = program_state.treasury)]
    pub treasury: SystemAccount<'info>,
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

    invoke(
        &system_instruction::transfer(
            &ctx.accounts.organizer.key(),
            &ctx.accounts.treasury.key(),
            EVENT_POST_FEE_LAMPORTS,
        ),
        &[
            ctx.accounts.organizer.to_account_info(),
            ctx.accounts.treasury.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

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
