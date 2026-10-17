export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatAmountInput = (value: string): string => {
  if (!value) return '';
  // Allow only digits and comma for decimals
  const cleaned = value.replace(/[^0-9,]/g, '');
  const parts = cleaned.split(',');
  let intPart = parts[0].replace(/^0+(?=\d)/, '');
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (parts.length > 1) {
    return `${intPart || '0'},${parts[1].slice(0, 2)}`;
  }
  return intPart;
};

export const numberToFormattedInput = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '';
  const [intPart, decPart] = num.toString().split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart ? `${formattedInt},${decPart.slice(0, 2)}` : formattedInt;
};

export const parseAmount = (text: string): number => {
  if (!text) return 0;
  const normalized = text.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]+/g, '');
  return parseFloat(normalized) || 0;
};
