import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  onClick,
}) => {
  const variantStyles = {
    blue: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-brand-300',
      iconBg: 'bg-brand-50 text-brand-600',
    },
    indigo: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-indigo-300',
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
    emerald: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    amber: {
      bg: 'bg-white',
      border: 'border-amber-200 hover:border-amber-400 bg-amber-50/30',
      iconBg: 'bg-amber-100 text-amber-700',
    },
    rose: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-600',
    },
    slate: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-slate-300',
      iconBg: 'bg-slate-100 text-slate-600',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-5 shadow-sm transition-all duration-150 ${style.bg} ${style.border} ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`rounded-lg p-2.5 ${style.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 truncate">{subtitle}</p>
      )}
    </div>
  );
};
