import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-4">
            <Image
              src="/blinkticket_logo.svg"
              alt="BlinkTicket"
              width={130}
              height={42}
              className="h-8 w-auto"
            />
            <Link href="/events" className="text-muted-foreground hover:text-accent transition">
              Events
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-accent transition">
              About
            </Link>
          </div>
          <p className="text-muted-foreground">Powered by Solana</p>
        </div>
      </div>
    </footer>
  );
}
