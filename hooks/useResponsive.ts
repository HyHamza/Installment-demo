'use client';

import { useState, useEffect } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isAbove = (breakpoint: Breakpoint) => windowSize.width >= breakpoints[breakpoint];
  const isBelow = (breakpoint: Breakpoint) => windowSize.width < breakpoints[breakpoint];
  const isBetween = (min: Breakpoint, max: Breakpoint) => 
    windowSize.width >= breakpoints[min] && windowSize.width < breakpoints[max];

  return {
    windowSize,
    // Specific breakpoint checks
    isMobile: isBelow('md'),
    isTablet: isBetween('md', 'lg'),
    isDesktop: isAbove('lg'),
    // Utility functions
    isAbove,
    isBelow,
    isBetween,
    // Common responsive patterns
    isTouchDevice: isBelow('lg'),
    showMobileNav: isBelow('md'),
    showDesktopNav: isAbove('md'),
    columnsForGrid: windowSize.width < 640 ? 1 : windowSize.width < 1024 ? 2 : 3,
  };
}

// Hook for responsive values
export function useResponsiveValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop: T;
}): T {
  const { isMobile, isTablet } = useResponsive();
  
  if (isMobile) return values.mobile;
  if (isTablet && values.tablet) return values.tablet;
  return values.desktop;
}

// Hook for responsive classes
export function useResponsiveClasses(classes: {
  mobile: string;
  tablet?: string;
  desktop: string;
}): string {
  return useResponsiveValue(classes);
}