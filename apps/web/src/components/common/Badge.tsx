import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const norm = status.toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (norm === 'PAID') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/10';
  } else if (norm === 'CONFIRMED') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/10';
  } else if (norm === 'ACTIVE') {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-600/10';
  } else if (norm === 'QUOTATION') {
    styles = 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-600/10';
  } else if (norm === 'DRAFT') {
    styles = 'bg-slate-100 text-slate-600 border-slate-200';
  } else if (norm === 'OVERDUE') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-600/10';
  } else if (norm === 'CLOSED' || norm === 'CANCELLED') {
    styles = 'bg-zinc-100 text-zinc-600 border-zinc-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {status}
    </span>
  );
};

