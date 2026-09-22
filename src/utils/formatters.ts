export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const parseAmount = (text: string): number => {
  return parseFloat(text.replace(/[^0-9,-]+/g, '').replace(',', '.')) || 0;
};
