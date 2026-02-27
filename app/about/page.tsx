'use client';

import { HeaderWrapper } from '@/components/header-wrapper';
import { Footer } from '@/components/footer';
import { Shield, Zap, Globe, Lock, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-background via-card to-background py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">About BlinkTicket</h1>
              <p className="text-xl text-muted-foreground">
                Revolutionizing event ticketing through blockchain technology on Solana
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
                <p className="text-lg text-muted-foreground mb-4">
                  BlinkTicket is reimagining how people buy, sell, and manage event tickets using
                  non-fungible tokens (NFTs) on the Solana blockchain.
                </p>
                <p className="text-lg text-muted-foreground mb-4">
                  We believe ticketing should be transparent, secure, and accessible to everyone.
                  Our platform eliminates scalpers, reduces fraud, and gives artists and event
                  organizers full control over their ticket distribution.
                </p>
                <p className="text-lg text-muted-foreground">
                  By leveraging Solana's speed and low-cost infrastructure, we deliver an experience
                  that's both user-friendly and economically sustainable.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 rounded-2xl p-8 text-center">
                  <Globe className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h3 className="font-bold text-foreground">Global</h3>
                </div>
                <div className="bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 rounded-2xl p-8 text-center">
                  <Zap className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h3 className="font-bold text-foreground">Fast</h3>
                </div>
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-8 text-center">
                  <Lock className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h3 className="font-bold text-foreground">Secure</h3>
                </div>
                <div className="bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 rounded-2xl p-8 text-center">
                  <Shield className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h3 className="font-bold text-foreground">Reliable</h3>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Blockchain Section */}
        <section className="py-20 bg-card border-b border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-12 text-center">Why Blockchain?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background border border-border rounded-lg p-8">
                <Users className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-xl font-bold mb-4">True Ownership</h3>
                <p className="text-muted-foreground">
                  Ticket holders have verifiable, permanent ownership of their NFT tickets
                  recorded on the immutable Solana blockchain.
                </p>
              </div>
              <div className="bg-background border border-border rounded-lg p-8">
                <TrendingUp className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-xl font-bold mb-4">Transparent Resales</h3>
                <p className="text-muted-foreground">
                  Secondary market transactions are transparent and traceable, eliminating
                  ticket fraud and scalping.
                </p>
              </div>
              <div className="bg-background border border-border rounded-lg p-8">
                <Zap className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-xl font-bold mb-4">Instant Settlement</h3>
                <p className="text-muted-foreground">
                  Transactions settle instantly on Solana, with minimal fees passing through
                  to event organizers and fans.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-12">Key Features</h2>
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-accent text-accent-foreground rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Compressed NFTs (cNFTs)</h3>
                  <p className="text-lg text-muted-foreground">
                    We use Solana's state compression technology to mint millions of tickets
                    for just a few SOL, dramatically reducing costs.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-accent text-accent-foreground rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Multi-Token Payments</h3>
                  <p className="text-lg text-muted-foreground">
                    Buy tickets with SOL or USDC stablecoins, giving users flexibility in
                    how they pay.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-accent text-accent-foreground rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Zero Platform Fees</h3>
                  <p className="text-lg text-muted-foreground">
                    We don't take platform fees. Event organizers keep 100% of ticket revenue,
                    minus network costs.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-accent text-accent-foreground rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Instant Transfers</h3>
                  <p className="text-lg text-muted-foreground">
                    Transfer tickets to anyone instantly with just their Solana address,
                    enabling gift-giving and resales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="py-20 bg-card border-b border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-12 text-center">Technology Stack</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-background border border-border rounded-lg p-6 text-center">
                <h3 className="font-bold mb-2">Blockchain</h3>
                <p className="text-muted-foreground">Solana</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-6 text-center">
                <h3 className="font-bold mb-2">Smart Contracts</h3>
                <p className="text-muted-foreground">Anchor Framework</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-6 text-center">
                <h3 className="font-bold mb-2">NFT Standard</h3>
                <p className="text-muted-foreground">cNFT (Compressed)</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-6 text-center">
                <h3 className="font-bold mb-2">Frontend</h3>
                <p className="text-muted-foreground">Next.js + React</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Join the Revolution</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Ready to experience the future of event ticketing? Connect your wallet and start
              buying NFT tickets today.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link
                href="/events"
                className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:opacity-90 transition"
              >
                Browse Events
              </Link>
              <Link
                href="/whitepaper"
                className="px-8 py-3 border border-accent text-accent rounded-lg font-semibold hover:bg-accent hover:text-accent-foreground transition"
              >
                Read Whitepaper
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
