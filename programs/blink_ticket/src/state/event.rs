use anchor_lang::prelude::*;

#[account]
pub struct Event {
    pub bump: u8,
    pub event_id: u64,
    pub organizer: Pubkey,
    pub event_name: String,
    pub symbol: String,
    pub uri: String,
    pub total_tickets: u64,
    pub tickets_sold: u64,
    pub price_in_lamports: u64, // Price in lamports (0.000000001 SOL)
    pub created_at: i64,
    pub event_active: bool,
    pub merkle_tree: Pubkey,
    pub treasury: Pubkey,
    pub revenue_collected: u64,
}

impl Event {
    pub const MAX_NAME_LENGTH: usize = 50;
    pub const MAX_SYMBOL_LENGTH: usize = 10;
    pub const MAX_URI_LENGTH: usize = 200;
    pub const SPACE: usize = 8
        + 1
        + 8
        + 32
        + 4 + Self::MAX_NAME_LENGTH
        + 4 + Self::MAX_SYMBOL_LENGTH
        + 4 + Self::MAX_URI_LENGTH
        + 8
        + 8
        + 8
        + 8
        + 1
        + 32
        + 32
        + 8;
}
