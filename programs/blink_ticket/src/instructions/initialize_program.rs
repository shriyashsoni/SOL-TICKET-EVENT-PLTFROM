use anchor_lang::prelude::*;
use crate::state::ProgramState;

#[derive(Accounts)]
pub struct InitializeProgram<'info> {
    #[account(
        init,
        payer = initializer,
        space = ProgramState::SPACE,
        seeds = [b"program-state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    #[account(mut)]
    pub initializer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeProgram>) -> Result<()> {
    let program_state = &mut ctx.accounts.program_state;
    program_state.bump = ctx.bumps.program_state;
    program_state.owner = ctx.accounts.initializer.key();
    program_state.total_events = 0;
    program_state.total_tickets_minted = 0;
    program_state.treasury = ctx.accounts.initializer.key();
    program_state.is_paused = false;
    program_state.platform_fee_bps = 0; // 0% fee for BlinkTicket
    
    msg!("BlinkTicket program initialized");
    Ok(())
}
