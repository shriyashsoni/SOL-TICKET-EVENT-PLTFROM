'use client';

import { useEffect, useState } from 'react';
import { Header } from './header';

export function HeaderWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="w-32 h-6 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return <Header />;
}
