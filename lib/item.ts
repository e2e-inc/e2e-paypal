// Amounts in cents; PayPal's API takes dollars as strings.
export const ITEM = { name: "e2e t-shirt", amount: 2000 };

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatUsd(cents: number): string {
  return usd.format(cents / 100);
}

// 2000 → "20.00"
export function toPayPalValue(cents: number): string {
  return (cents / 100).toFixed(2);
}

// "20.00" → 2000
export function fromPayPalValue(value: string): number {
  return Math.round(Number(value) * 100);
}
