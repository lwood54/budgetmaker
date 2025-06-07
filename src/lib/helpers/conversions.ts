export const toFullDateTimeDisplay = (date: string) => {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'invalid date format';
  }
  return dateObj.toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
};

export const toDateDisplayShort = (date: string) => {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'invalid date format';
  }
  // Use UTC methods to prevent timezone shifts
  return new Date(
    dateObj.getUTCFullYear(),
    dateObj.getUTCMonth(),
    dateObj.getUTCDate(),
  ).toLocaleString('en-US', {
    dateStyle: 'short',
  });
};

export const toShortDateTimeDisplay = (date: string) => {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'invalid date format';
  }

  return dateObj.toLocaleString('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

export const toLocalCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const toUSDCurrencyNumber = (amount: number) => {
  return Number(amount.toFixed(2));
};

export const centsToDollars = (cents: number) => {
  const value = (cents / 100).toFixed(2);
  return {
    value,
    currency: toLocalCurrency(Number(value)),
  };
};
