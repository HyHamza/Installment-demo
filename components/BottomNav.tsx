'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, UserPlus, CheckSquare, FolderOpen, Settings, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const bottomNavItems = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Admin', href: '/admin', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom md:hidden z-30">
      <nav className="flex items-center justify-around py-2">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-3 min-w-[60px] rounded-lg transition-colors no-select',
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 mb-1',
                isActive && 'text-blue-600'
              )} />
              <span className={cn(
                'text-xs font-medium',
                isActive ? 'text-blue-600' : 'text-gray-500'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}