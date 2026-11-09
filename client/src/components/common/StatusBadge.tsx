import React from 'react';
import { ClaimStatus, QueryStatus } from '../../types';

interface StatusBadgeProps {
  status: ClaimStatus | QueryStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  switch (status) {
    case 'DRAFT':
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
      label = 'Draft';
      break;
    case 'SUBMITTED':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Submitted';
      break;
    case 'TPA_REVIEW':
      badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      label = 'Under TPA Review';
      break;
    case 'QUERY_RAISED':
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse';
      label = 'Query Raised';
      break;
    case 'APPROVED':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Approved';
      break;
    case 'SANCTIONED':
      badgeStyle = 'bg-teal-50 text-teal-800 border-teal-300';
      label = 'Sanctioned';
      break;
    case 'SETTLED':
      badgeStyle = 'bg-green-100 text-green-900 border-green-300';
      label = 'Settled';
      break;
    case 'REJECTED':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Rejected';
      break;
    case 'OPEN':
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300';
      label = 'Open Query';
      break;
    case 'RESPONDED':
      badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
      label = 'Hospital Responded';
      break;
    case 'RESOLVED':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Query Resolved';
      break;
    case 'REOPENED':
      badgeStyle = 'bg-orange-50 text-orange-800 border-orange-300';
      label = 'Query Reopened';
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide uppercase ${sizeClasses[size]} ${badgeStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {label}
    </span>
  );
};

