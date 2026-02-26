use anchor_lang::prelude::*;

#[account]
pub struct Ticket {
    pub bump: u8,
    pub ticket_id: u64,
    pub event_id: u64,
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub metadata_uri: String,
    pub created_at: i64,
    pub transferred: bool,
    pub transferred_to: Option<Pubkey>,
    pub transferred_at: Option<i64>,
    pub used: bool,
    pub used_at: Option<i64>,
}

impl Ticket {
    pub const MAX_URI_LENGTH: usize = 200;
    pub const SPACE: usize = 8
        + 1
        + 8
        + 8
        + 32
        + 32
        + 4 + Self::MAX_URI_LENGTH
        + 8
        + 1
        + 1 + 32
        + 1 + 8
        + 1
        + 1 + 8;
}
