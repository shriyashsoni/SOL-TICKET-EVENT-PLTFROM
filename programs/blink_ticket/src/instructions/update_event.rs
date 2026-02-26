use anchor_lang::prelude::*;
use crate::state::Event;
use crate::ErrorCode;

#[derive(Accounts)]
pub struct UpdateEvent<'info> {
    #[account(mut, has_one = organizer)]
    pub event: Account<'info, Event>,
    pub organizer: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateEvent>,
    new_price: u64,
) -> Result<()> {
    let event = &mut ctx.accounts.event;

    require!(new_price > 0, ErrorCode::InvalidPaymentAmount);
    require!(event.tickets_sold == 0, ErrorCode::InvalidEvent);

    event.price_in_lamports = new_price.saturating_mul(1_000_000_000);

    msg!(
        "Event {} price updated to {} lamports",
        event.event_id,
        event.price_in_lamports
    );

    Ok(())
}
