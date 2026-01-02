import React from 'react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Main content with mobile-first spacing */}
      <main className="container mx-auto max-w-5xl px-4 py-4 md:px-6 md:py-6 pb-20 md:pb-6">
        <div className="fade-in">
          {children}
        </div>
      </main>
      
      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
