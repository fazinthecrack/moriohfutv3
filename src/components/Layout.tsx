import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { PlaylistWidget } from './PlaylistWidget';
import { useClickSound } from '@/hooks/useClickSound';
import backgroundImg from '@/assets/background.png';

export function Layout({ children }: { children: ReactNode }) {
  useClickSound();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Static image background for authenticated pages */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={backgroundImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <main className="pt-20">{children}</main>
      </div>
      <PlaylistWidget />
    </div>
  );
}
