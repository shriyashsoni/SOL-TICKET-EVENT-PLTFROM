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
                Direct event ticketing via social feeds on Solana
              </p>
              <p className="text-sm text-muted-foreground mt-4">Version 2.0 | 2026</p>
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
                  The platform supports multiple payment options (SOL and USDC) and operates on
                  both Testnet and Mainnet, with zero platform fees.
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
                  BlinkTicket combines Solana Actions/Blinks, compressed NFT ticketing, and
                  an Anchor smart contract so users can buy from social feeds in one flow.
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">3.1 Key Features</h3>
                    <ul className="space-y-2 text-foreground list-disc list-inside">
                      <li>Social-feed checkout with Solana Blinks</li>
                      <li>Immutable ticket ownership verified on Solana</li>
                      <li>On-chain payment settlement to organizer treasury</li>
                      <li>Low-cost minting design for compressed NFT tickets</li>
                      <li>Wallet-native signing with Phantom</li>
                      <li>Zero platform fees for organizers and fans</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">3.2 User Benefits</h3>
                    <p className="text-foreground">
                      Event attendees enjoy lower prices, instant transfers, and verified ownership.
                      Event organizers maintain complete control over ticket distribution and capture
                      full ticket revenue.
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
                      <li>Purchase ticket instruction with treasury payment</li>
                      <li>Event state tracking (supply, sold, revenue)</li>
                      <li>Fallback direct SOL transfer supported for action compatibility</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">4.2 App + API</h3>
                    <p className="text-foreground">
                      Next.js API routes generate action transactions for wallet signing and
                      the frontend consumes live wallet, event, ticket, and transaction state.
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
                      <li>Zero platform fees for organizers and buyers</li>
                      <li>Network fees paid to Solana validators (~0.00001 SOL per transaction)</li>
                      <li>Tickets priced in SOL or USDC at organizer's discretion</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">5.2 Cost Analysis</h3>
                    <p className="text-foreground mb-2">
                      Event with 1,000,000 tickets:
                    </p>
                    <ul className="space-y-2 text-foreground list-disc list-inside">
                      <li>Traditional platform: ~$150,000-250,000 in fees</li>
                      <li>BlinkTicket: ~10-50 SOL (~$1,000-5,000)</li>
                      <li>Savings: ~97% reduction in ticketing costs</li>
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
                      <li>Real event listing, purchase, tickets, and dashboard state</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">Next Milestones</h3>
                    <ul className="space-y-2 text-foreground list-disc list-inside">
                      <li>Mainnet rollout with hardened observability</li>
                      <li>Complete compressed NFT mint/verify integration</li>
                      <li>Organizer tooling for event account automation</li>
                    </ul>
                  </div>
                </div>
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
