use anchor_lang::prelude::*;

#[account]
pub struct ProgramState {
    pub bump: u8,
    pub owner: Pubkey,
    pub total_events: u64,
    pub total_tickets_minted: u64,
    pub treasury: Pubkey,
    pub is_paused: bool,
    pub platform_fee_bps: u16, // Basis points (0 for BlinkTicket)
}

impl ProgramState {
    pub const SPACE: usize = 8 + 1 + 32 + 8 + 8 + 32 + 1 + 2;
}
