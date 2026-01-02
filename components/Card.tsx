import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'mobile' | 'elevated';
  interactive?: boolean;
}

export function Card({ className, children, variant = 'default', interactive = false, ...props }: CardProps) {
  const variants = {
    default: 'rounded-lg border border-gray-200 bg-white shadow-sm',
    mobile: 'mobile-card', // Uses the CSS class we defined
    elevated: 'rounded-xl border border-gray-200 bg-white shadow-lg',
  };

  return (
    <div
      className={cn(
        variants[variant],
        interactive && 'cursor-pointer hover:shadow-md active:scale-[0.98] transition-all duration-200 touch-manipulation',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-4 md:p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg md:text-xl font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('p-4 pt-0 md:p-6 md:pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('flex items-center p-4 pt-0 md:p-6 md:pt-0', className)} {...props}>
      {children}
    </div>
  );
}
