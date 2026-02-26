use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use crate::state::Event;
use crate::ErrorCode;

#[derive(Accounts)]
pub struct PurchaseTicket<'info> {
    #[account(mut)]
    pub event: Account<'info, Event>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut, address = event.treasury)]
    pub treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<PurchaseTicket>,
    amount: u64,
) -> Result<()> {
    let event = &mut ctx.accounts.event;

    require!(event.event_active, ErrorCode::InvalidEvent);
    require!(
        event.tickets_sold < event.total_tickets,
        ErrorCode::EventCapacityExceeded
    );
    require!(
        amount == event.price_in_lamports,
        ErrorCode::InvalidPaymentAmount
    );

    invoke(
        &system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &ctx.accounts.treasury.key(),
            amount,
        ),
        &[
            ctx.accounts.buyer.to_account_info(),
            ctx.accounts.treasury.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    event.revenue_collected = event.revenue_collected.saturating_add(amount);
    event.tickets_sold = event.tickets_sold.saturating_add(1);

    msg!(
        "Ticket purchased for event {} - Revenue: {} lamports",
        event.event_id,
        event.revenue_collected
    );

    Ok(())
}
