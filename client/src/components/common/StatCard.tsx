import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'teal';
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
      iconBg: 'bg-brand-50 text-brand-600 border border-brand-100',
    },
    indigo: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-indigo-300',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    },
    emerald: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    teal: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-teal-300',
      iconBg: 'bg-teal-50 text-teal-700 border border-teal-100',
    },
    amber: {
      bg: 'bg-white',
      border: 'border-amber-200 hover:border-amber-400 bg-amber-50/20',
      iconBg: 'bg-amber-100 text-amber-700 border border-amber-200',
    },
    rose: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
    },
    slate: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-slate-300',
      iconBg: 'bg-slate-100 text-slate-600 border border-slate-200',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-4 sm:p-5 shadow-clinical transition-all duration-150 ${style.bg} ${style.border} ${
        onClick ? 'cursor-pointer hover:shadow-clinical-md hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`rounded-xl p-2.5 ${style.iconBg}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline">
        <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">{value}</span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 truncate">{subtitle}</p>
      )}
    </div>
  );
};

