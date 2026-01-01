'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, UserPlus, CheckSquare, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProfileSwitcher } from './ProfileSwitcher';

// Using a simple navigation structure
const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Add Customer', href: '/customers/add', icon: UserPlus },
  { name: 'Daily Tick', href: '/daily', icon: CheckSquare },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <div className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm md:px-6">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold text-blue-600">
          InstallmentApp
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-600',
                  isActive ? 'text-blue-600' : 'text-gray-600'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <ProfileSwitcher />
      </div>

    </div>
  );
}
