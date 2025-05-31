export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(centsToDollars(cents));
}

export function parseUserInputToCents(input: string): number | null {
  const cleaned = input.trim();
  if (!cleaned) return null;

  const dollars = parseFloat(cleaned);
  if (isNaN(dollars) || dollars < 0) return null;

  return dollarsToCents(dollars);
}
