'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, UserPlus, CheckSquare, Menu, X, FolderOpen, Settings, BarChart3, FileText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProfileSwitcher } from './ProfileSwitcher';
import { SyncButton } from './SyncButton';

// Mobile-first navigation structure
const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, shortName: 'Home' },
  { name: 'Customers', href: '/customers', icon: Users, shortName: 'Customers' },
  { name: 'Projects', href: '/projects', icon: FolderOpen, shortName: 'Projects' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, shortName: 'Analytics' },
  { name: 'Reports', href: '/reports', icon: FileText, shortName: 'Reports' },
  { name: 'Add Customer', href: '/customers/add', icon: UserPlus, shortName: 'Add' },
  { name: 'Daily Tick', href: '/daily', icon: CheckSquare, shortName: 'Daily' },
  { name: 'Admin', href: '/admin', icon: Settings, shortName: 'Admin' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* Mobile-first header */}
      <div className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm safe-area-top">
        {/* Mobile menu button and logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors no-select"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
          
          <Link href="/" className="text-lg md:text-xl font-bold text-blue-600 no-select">
            <span className="md:hidden">IA</span>
            <span className="hidden md:inline">InstallmentApp</span>
          </Link>
        </div>

        {/* Desktop navigation - show primary items and collapse extras into "More" */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 xl:gap-3">
          {/* show first N items inline to avoid overflow */}
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1 lg:gap-2 text-xs lg:text-sm font-medium transition-colors hover:text-blue-600 px-2 lg:px-3 py-2 rounded-lg whitespace-nowrap flex-shrink-0',
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                )}
                title={item.name}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden lg:inline">{item.name}</span>
              </Link>
            );
          })}

          {/* More dropdown for remaining items */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              aria-expanded={moreOpen}
            >
              More
            </button>

            {moreOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                <div className="flex flex-col py-1">
                  {navItems.slice(5).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn('px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2')}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right side - Profile and Sync */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:block">
            <ProfileSwitcher />
          </div>
          <SyncButton />
        </div>
      </div>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile menu */}
          <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 md:hidden slide-up">
            <div className="flex flex-col h-full">
              {/* Menu header */}
              <div className="flex items-center justify-between p-4 border-b safe-area-top">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Profile switcher in mobile menu */}
              <div className="p-4 border-b bg-gray-50">
                <ProfileSwitcher />
              </div>

              {/* Navigation items */}
              <nav className="flex-1 py-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'mobile-nav-item',
                        isActive ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Menu footer */}
              <div className="p-4 border-t bg-gray-50 safe-area-bottom">
                <div className="text-xs text-gray-500 text-center">
                  InstallmentApp v1.0
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}