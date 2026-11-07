import React from 'react';

interface CurrencyFormatterProps {
  amount: number | null | undefined;
  className?: string;
  showPrefix?: boolean;
}

export const CurrencyFormatter: React.FC<CurrencyFormatterProps> = ({
  amount,
  className = '',
  showPrefix = true,
}) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return <span className={`text-slate-400 ${className}`}>—</span>;
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <span className={`font-semibold tabular-nums ${className}`}>
      {showPrefix ? '₹' : ''}
      {formatted}
    </span>
  );
};
