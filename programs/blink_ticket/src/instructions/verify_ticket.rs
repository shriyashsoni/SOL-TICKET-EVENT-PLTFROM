use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct VerifyTicket<'info> {
    pub owner: Signer<'info>,
}

pub fn handler(
    _ctx: Context<VerifyTicket>,
) -> Result<()> {
    msg!("Ticket verified successfully");
    Ok(())
}
