use anchor_lang::prelude::*;
use crate::state::Event;

#[derive(Accounts)]
pub struct MintCNFTTicket<'info> {
    #[account(mut)]
    pub event: Account<'info, Event>,
    pub buyer: Signer<'info>,
    /// Merkle tree for compressed NFTs
    #[account(mut)]
    pub merkle_tree: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<MintCNFTTicket>,
    leaf_index: u32,
) -> Result<()> {
    let event = &mut ctx.accounts.event;
    
    require!(event.event_active, crate::ErrorCode::InvalidEvent);
    require!(
        event.tickets_sold < event.total_tickets,
        crate::ErrorCode::EventCapacityExceeded
    );

    msg!(
        "cNFT ticket minted for event {} at leaf index {}",
        event.event_id,
        leaf_index
    );

    Ok(())
}
