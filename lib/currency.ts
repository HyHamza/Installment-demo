// Currency formatting utilities for PKR (Pakistani Rupee)

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 10000000) { // 1 crore
    return `PKR ${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) { // 1 lakh
    return `PKR ${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) { // 1 thousand
    return `PKR ${(amount / 1000).toFixed(1)}K`;
  } else {
    return `PKR ${amount.toFixed(0)}`;
  }
}

export function parseCurrency(value: string): number {
  // Remove currency symbols and parse
  return parseFloat(value.replace(/[₹PKR,\s]/g, '')) || 0;
}

export const CURRENCY_SYMBOL = 'PKR';
export const CURRENCY_CODE = 'PKR';