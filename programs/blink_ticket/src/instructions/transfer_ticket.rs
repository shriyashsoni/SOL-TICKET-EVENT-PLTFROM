use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct TransferTicket<'info> {
    pub owner: Signer<'info>,
    pub new_owner: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<TransferTicket>,
    leaf_index: u32,
) -> Result<()> {
    msg!(
        "Transferring ticket at leaf index {} from {} to {}",
        leaf_index,
        ctx.accounts.owner.key(),
        ctx.accounts.new_owner.key()
    );

    Ok(())
}
