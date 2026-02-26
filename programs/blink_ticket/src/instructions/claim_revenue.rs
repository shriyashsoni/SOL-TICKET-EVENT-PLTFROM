use anchor_lang::prelude::*;
use crate::state::Event;

#[derive(Accounts)]
pub struct ClaimRevenue<'info> {
    #[account(mut, has_one = organizer)]
    pub event: Account<'info, Event>,
    pub organizer: Signer<'info>,
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
}

pub fn handler(
    ctx: Context<ClaimRevenue>,
) -> Result<()> {
    let event = &mut ctx.accounts.event;

    require!(event.organizer == ctx.accounts.organizer.key(), crate::ErrorCode::Unauthorized);
    event.revenue_collected = 0;
    msg!("Revenue settlement is instant; claim_revenue just resets accounting for event {}", event.event_id);

    Ok(())
}
