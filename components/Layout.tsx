import React from 'react';
import { Navbar } from '@/components/Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <main className="container mx-auto max-w-5xl p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
