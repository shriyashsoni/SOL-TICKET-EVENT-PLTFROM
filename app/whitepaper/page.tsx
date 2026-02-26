'use client';

import { HeaderWrapper } from '@/components/header-wrapper';
import { Footer } from '@/components/footer';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function WhitepaperPage() {
  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">BlinkTicket Whitepaper</h1>
              <p className="text-base md:text-xl text-muted-foreground">
                Link-to-event publishing and on-chain ticket verification on Solana Testnet
              </p>
              <p className="text-sm text-muted-foreground mt-4">Version 2.0 | 2026</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-12">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Network</p>
                <p className="font-semibold">Solana Testnet</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Program ID</p>
                <p className="font-semibold break-all text-sm">E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Event Post Fee</p>
                <p className="font-semibold">0.0001 SOL</p>
              </div>
            </div>

            {/* Table of Contents */}
            <div className="bg-card border border-border rounded-lg p-8 mb-12">
              <h2 className="text-2xl font-bold mb-6">Table of Contents</h2>
              <nav className="space-y-3">
                <a href="#introduction" className="flex items-center gap-2 text-accent hover:underline">
                  <ChevronRight className="w-4 h-4" />
                  1. Introduction
                </a>
                <a href="#problem" className="flex items-center gap-2 text-accent hover:underline">
                  <ChevronRight className="w-4 h-4" />
                  2. Problem
                </a>
                <a href="#solution" className="flex items-center gap-2 text-accent hover:underline">
                  <ChevronRight className="w-4 h-4" />
                  3. Solution
                </a>
                <a href="#architecture" className="flex items-center gap-2 text-accent hover:underline">
                  <ChevronRight className="w-4 h-4" />
                  4. Technical Architecture
                </a>
                <a href="#tokenomics" className="flex items-center gap-2 text-accent hover:underline">
                  <ChevronRight className="w-4 h-4" />
                  5. Economics
                </a>
                <a href="#roadmap" className="flex items-center gap-2 text-accent hover:underline">
                  <ChevronRight className="w-4 h-4" />
                  6. Current Status
                </a>
                <a href="#security" className="flex items-center gap-2 text-accent hover:underline">
                  <ChevronRight className="w-4 h-4" />
                  7. Security and Verification
                </a>
              </nav>
            </div>

            {/* Sections */}
            <div className="space-y-16 prose prose-invert max-w-none">
              <section id="introduction" className="bg-card border border-border rounded-lg p-8">
                <h2 className="text-3xl font-bold mb-4 text-foreground">1. Introduction</h2>
                <p className="text-foreground mb-4">
                  BlinkTicket is a decentralized ticketing platform built on the Solana blockchain
                  that enables secure, transparent, and efficient ticket distribution for events.
                </p>
                <p className="text-foreground mb-4">
                  By leveraging non-fungible tokens (NFTs), specifically Compressed NFTs (cNFTs),
                  we provide a cost-effective solution that maintains the security and immutability
                  benefits of blockchain technology while reducing operational costs to near-zero.
                </p>
                <p className="text-foreground">
                  The platform supports a practical event lifecycle: scrape event details from a URL,
                  create an on-chain event transaction, verify signatures, and enable wallet-based ticket purchases.
                </p>
              </section>

              <section id="problem" className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="text-3xl font-bold mb-4 text-foreground">2. Problem</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">2.1 Current Issues</h3>
                    <ul className="space-y-2 text-foreground list-disc list-inside">
                      <li>Ticket fraud and counterfeiting remains prevalent</li>
                      <li>Secondary market scalping artificially inflates prices</li>
                      <li>Lack of transparency in ticket transactions</li>
                      <li>Unreliable off-chain confirmation flows confuse users</li>
                      <li>High platform fees reduce artist and organizer revenue</li>
                      <li>Slow settlement times and payment processing</li>
                      <li>Limited interoperability between ticketing platforms</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">2.2 Opportunity</h3>
                    <p className="text-foreground">
                      Traditional platforms still rely on closed databases, delayed settlements,
                      and fee-heavy checkout flows. Solana provides instant, low-cost settlement
                      and verifiable ownership for global ticketing use cases.
                    </p>
                  </div>
                </div>
              </section>

              <section id="solution" className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="text-3xl font-bold mb-4 text-foreground">3. Solution</h2>
                <p className="text-foreground mb-4">
                  BlinkTicket combines AI-assisted metadata extraction, Solana action transactions,
                  and an Anchor smart contract so organizers and attendees can complete posting and purchase
                  in a wallet-native flow.
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">3.1 Key Features</h3>
                    <ul className="space-y-2 text-foreground list-disc list-inside">
                      <li>Create event drafts from URL scraping (title, date, location, poster)</li>
                      <li>On-chain create-event posting with enforced posting fee transfer</li>
                      <li>Immutable ticket ownership and purchase verification on Solana</li>
                      <li>On-chain payment settlement to organizer treasury</li>
                      <li>Dashboard metrics for event sales, revenue, and withdrawals</li>
                      <li>Retry + RPC fallback verification for stronger reliability</li>
                      <li>Wallet-native signing with Phantom</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">3.2 User Benefits</h3>
                    <p className="text-foreground">
                      Event attendees get transparent ticket state and on-chain confirmation.
                      Organizers can publish faster with URL intake, track performance, and withdraw
                      accumulated profit from a unified dashboard flow.
                    </p>
                  </div>
                </div>
              </section>

              <section id="architecture" className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="text-3xl font-bold mb-4 text-foreground">4. Technical Architecture</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">4.1 On-Chain Program</h3>
                    <p className="text-foreground mb-2">
                      The deployed Anchor program on testnet handles event lifecycle,
                      ticket purchase checks, and payment transfer validation.
                    </p>
                    <ul className="space-y-2 text-foreground list-disc list-inside">
                      <li>Program ID: E1pVxMXKz1QSStibqtRgzSwJY2xqvPWysD5krfdmuerc</li>
                      <li>Initialize program and create event instructions</li>
                      <li>Create-event posting fee transfer constraint (0.0001 SOL)</li>
                      <li>Purchase ticket instruction with treasury payment</li>
                      <li>Event state tracking (supply, sold, revenue)</li>
                      <li>Fallback direct SOL transfer supported for action compatibility</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">4.2 App + API</h3>
                    <p className="text-foreground">
                      Next.js API routes generate action transactions for wallet signing, verify
                      resulting signatures, and persist event/ticket records. Verification is hardened
                      using retries and testnet RPC fallback endpoints.
                    </p>
                  </div>
                </div>
              </section>

              <section id="tokenomics" className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="text-3xl font-bold mb-4 text-foreground">5. Economics</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">5.1 Pricing Model</h3>
                    <ul className="space-y-2 text-foreground list-disc list-inside">
                      <li>Event post fee: 0.0001 SOL (enforced on-chain)</li>
                      <li>Ticket price is organizer-defined per event (SOL)</li>
                      <li>Network fees paid to Solana validators (~0.00001 SOL per transaction)</li>
                      <li>Organizer revenue visibility and withdrawal tracking in dashboard</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">5.2 Cost Analysis</h3>
                    <p className="text-foreground mb-2">
                      Typical benefits versus traditional ticket stacks:
                    </p>
                    <ul className="space-y-2 text-foreground list-disc list-inside">
                      <li>Near-instant settlement on Solana testnet</li>
                      <li>Transparent transaction verification for users and organizers</li>
                      <li>Reduced platform overhead through wallet-native actions</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section id="roadmap" className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="text-3xl font-bold mb-4 text-foreground">6. Current Status</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">Live on Testnet</h3>
                    <ul className="space-y-2 text-foreground list-disc list-inside">
                      <li>Anchor program deployed on Solana testnet</li>
                      <li>Deployment signature: 4WySfMFgCAGtm9jUv4dHFvBtcXbDjEX2Vkt7dkEs6cXe2Zj3py5R5BaAx4EbsTG4kLFtgmTwFH1ATNvJDP5563bA</li>
                      <li>Phantom wallet connect and signing flow</li>
                      <li>Real event posting, purchase, tickets, and dashboard state</li>
                      <li>Link scraping endpoint for event metadata autofill</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">Next Milestones</h3>
                    <ul className="space-y-2 text-foreground list-disc list-inside">
                      <li>Persistent database layer for production-grade storage</li>
                      <li>Extended organizer analytics and export tooling</li>
                      <li>Mainnet readiness checklist and launch process</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section id="security" className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="text-3xl font-bold mb-4 text-foreground">7. Security and Verification</h2>
                <ul className="space-y-2 text-foreground list-disc list-inside">
                  <li>All critical actions require explicit wallet signatures</li>
                  <li>Server-side transaction checks confirm signer and account expectations</li>
                  <li>Transaction verification includes retries to handle RPC propagation delay</li>
                  <li>Fallback RPC candidates reduce false negatives on busy testnet windows</li>
                </ul>
              </section>
            </div>

            {/* Footer CTA */}
            <div className="mt-16 bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Launch Your Events?</h3>
              <Link
                href="/connect-wallet"
                className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:opacity-90 transition"
              >
                Get Started
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
